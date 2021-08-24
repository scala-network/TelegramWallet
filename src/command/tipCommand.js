/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /tip <username>
 * @module Commands/tip
 */
const Command = require('../base/command');
const STATUS = require('../status');
const Telegraf = require('telegraf');

class TransferCommand extends Command {
	enabled = true;

	get name() {
        return "tip";
    }
	
	get description() {
		return "Tip coin to another user. To set default tip value go to /set tip <amount> (usages : /tip <username>)";
	}

	auth(ctx) {
		return ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const sender = User.findById(ctx.from.id);
		if(!sender) {
			return ctx.telegram.sendMessage(ctx.from.id,`User not avaliable please /create`);
		}

		if(!sender.wallet) {
			return ctx.telegram.sendMessage(ctx.from.id,`No wallet avaliable`);
		}
		
		let wallet = sender.wallet;

		const user = User.findByUsername(ctx.appRequest.args[1]);

		if(user === STATUS.ERROR_ACCOUNT_NOT_EXISTS) {
			return ctx.reply("User account is not avaliable. Share bot to user and create an account");
		}

		const result = await this.Coin.getBalance(ctx.from.id, wallet.id);
		wallet.balance = result.result.balance;
		wallet.unlock = result.result.unlocked_balance;
		wallet = await Wallet.update(wallet);

		const amount = this.Coin.parse(ctx.appRequest.args[1]);
		if(amount > parseFloat(wallet.unlock)) {
			return ctx.telegram.sendMessage(ctx.from.id,'Insufficient fund');	
		}

		if(sender.tip_submit === 'enabled') {

			const trx = await this.Coin.transfer(ctx.from.id, wallet.id, user.wallet.address, amount);
			if('error' in trx) {
				return ctx.reply(trx.error);
			}

			const uuid = await Wallet.metaToUid(ctx.from.id, trx.tx_metadata);

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

		} else {
			const trx = await this.Coin.transferSubmit(ctx.from.id, wallet.id, user.wallet.address, amount);
			if('error' in trx) {
				return ctx.reply(trx.error);
			}

			const balance = parseInt(wallet.balance) - parseInt(trx.amount) - parseInt(trx.fee);

			return ctx.telegram.sendMessage(ctx.from.id,`
				** Transaction Details **

				From: 
				${wallet.address}
				
				To: 
				@${user.username}
				
				Amount : ${this.Coin.format(trx.amount)}
				Fee : ${this.Coin.format(trx.fee)}
				Trx Hash: ${trx.tx_hash}
				Current Balance : ${this.Coin.format(balance)}
			`);
		}

		

		


	}
}
module.exports = TransferCommand;
