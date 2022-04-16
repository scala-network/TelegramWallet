/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');
const STATUS = require('../status');
const { Markup } = require('telegraf');

class WithdrawCommand extends Command {

	get name() {
        return "withdraw";
    }
	
	get description() {
		return "Withdraw coins in wallet (usages : /withdraw <coin_address> <amount>)";
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 1) {
            return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const Meta = this.loadModel("Meta");
		const address = ctx.appRequest.args[0];
		const valid = await this.Coin.validateAddress(ctx.from.id, address);

		switch(valid) {
			case null:
				return ctx.appResponse.reply("Unable to validate address");
			case false:
				return ctx.appResponse.reply("Address is not valid");
			case true:
				let wallet = await Wallet.findByUserId(ctx.from.id);

				if(!wallet) {
					return ctx.appResponse.reply('No wallet avaliable');
				}

				wallet  = await Wallet.syncBalance(ctx.from.id, wallet, this.Coin);
				if(wallet && 'error' in wallet) {
					return ctx.sendMessage(ctx.from.id, wallet.error);
				}
				const amount = this.Coin.parse(ctx.appRequest.args[1]);
				if(amount > parseFloat(wallet.unlock)) {
					return ctx.appResponse.reply('Insufficient fund');	
				}

				const trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, [{address, amount}], true);

				if('error' in trx) {
					return ctx.appResponse.reply(trx.error);
				}

				const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));
				const trx_amount = trx.amount_list.reduce((a, b) => a + b, 0);
				const tx_hash = trx.tx_hash_list.join("\n * ");
				const trx_fee = trx.fee_list.reduce((a, b) => a + b, 0);
				const balance = parseInt(wallet.balance) - parseInt(trx_amount) - parseInt(trx_fee);

				return ctx.appResponse.reply(`
<b><u>Transaction Details</u></b>

<b>From:</b>
${wallet.address}

<b>To:</b>
${address}
			
<b>Amount :</b> ${this.Coin.format(trx_amount)}
<b>Fee :</b> ${this.Coin.format(trx_fee)}
<b>Trx Meta ID :</b> ${uuid}
<b>Trx Expiry :</b> ${global.config.rpc.metaTTL} seconds
<b>Current Unlock Balance :</b> ${this.Coin.format(wallet.balance)}
<b>Number of transactions :</b> ${trx.tx_hash_list.length}`,
{
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([Markup.button.callback('Confirm Submit?', 'submit', uuid)])
});
			default:
				try{
					return ctx.appResponse.reply(valid);
				} catch (e) {
					return ctx.appResponse.reply("Unable to withdraw coin");
				}
				break;
		}
	}
}
module.exports = WithdrawCommand;
