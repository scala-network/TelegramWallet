/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');
const STATUS = require('../status');

class WithdrawCommand extends Command {
	enabled = true;

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
            return ctx.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const Meta = this.loadModel("Meta");
		const address = ctx.appRequest.args[0];
		const valid = await this.Coin.validateAddress(ctx.from.id, address);

		switch(valid) {
			case null:
				return ctx.reply("Unable to validate address");
			case false:
				return ctx.reply("Address is not valid");
			case true:
				let wallet = await Wallet.findByUserId(ctx.from.id);

				if(!wallet) {
					return ctx.reply('No wallet avaliable');
				}

				wallet  = await Wallet.syncBalance(ctx.from.id, wallet, this.Coin);
				if(wallet && 'error' in wallet) {
					return ctx.sendMessage(ctx.from.id, wallet.error);
				}
				const amount = this.Coin.parse(ctx.appRequest.args[1]);
				if(amount > parseFloat(wallet.unlock)) {
					return ctx.reply('Insufficient fund');	
				}

				const trx = await this.Coin.transfer(ctx.from.id, wallet.wallet_id, address, amount, true);

				if('error' in trx) {
					return ctx.reply(trx.error);
				}

				const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata);

				return ctx.telegram.sendMessage(
					ctx.from.id,
					`
** Transaction Details **

From: 
${wallet.address}

To: 
${address}

Amount : ${this.Coin.format(trx.amount)}
Fee : ${this.Coin.format(trx.fee)}
Trx Meta ID: ${uuid}
Trx Expiry: ${global.config.rpc.metaTTL} seconds
Current Unlock Balance : ${this.Coin.format(wallet.balance)}

To proceed with transaction run
/submit ${uuid} 
				`
				);
			default:
				try{
					return ctx.reply(valid);
				} catch (e) {
					return ctx.reply("Unable to withdraw coin");
				}
				break;
		}
	}
}
module.exports = WithdrawCommand;
