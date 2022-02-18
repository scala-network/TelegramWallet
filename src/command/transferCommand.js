/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');
const STATUS = require('../status');

class TransferCommand extends Command {
	enabled = false;

	get name() {
        return "transfer";
    }
	
	get description() {
		return "Transfer coin to another user (usages : /transfer <username> <amount>)";
	}

	auth(ctx) {
		return true;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 1) {
            return ctx.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const Meta = this.loadModel("Meta");

		let username = ctx.appRequest.args[0].trim();
		if(username.startsWith("@")) {
			username = username.substr(1);
		}

		const user = User.findByUsername(username);

		if(user === STATUS.ERROR_ACCOUNT_NOT_EXISTS) {
			return ctx.reply("User account is not avaliable. Share bot to user and create an account");
		}

		
		if(!user.wallet) {
			user.wallet = await Wallet.findByUserId(ctx.from.id);
			if(!user.wallet) {
				return ctx.reply('No wallet avaliable');
			}
		}
		
		let wallet  = await Wallet.syncBalance(ctx.from.id, user.wallet, this.Coin);
		if(wallet && 'error' in wallet) {
			return ctx.sendMessage(ctx.from.id, wallet.error);
		}
		const amount = this.Coin.parse(ctx.appRequest.args[1]);
		if(amount > parseFloat(wallet.unlock)) {
			return ctx.reply('Insufficient fund');	
		}

		const trx = await this.Coin.transfer(ctx.from.id, wallet.wallet_id, user.wallet.address, amount, true);

		if('error' in trx) {
			return ctx.reply("Error transfering : "+trx.error);
		}

		const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata);

		return ctx.telegram.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
${wallet.address}

To: 
@${user.username}

Amount : ${this.Coin.format(trx.amount)}
Fee : ${this.Coin.format(trx.fee)}
Trx Meta ID: ${uuid}
Trx Expiry: ${global.config.rpc.metaTTL} seconds
Current Unlock Balance : ${this.Coin.format(wallet.balance)}

To proceed with transaction run
/submit ${uuid} 
		`);


	}
}
module.exports = TransferCommand;
