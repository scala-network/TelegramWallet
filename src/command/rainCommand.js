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
        return "rain";
    }
	
	get description() {
		return "Send coins to other users. To set default rain value go to /set rain <amount>";
	}

	auth(ctx) {
		return ctx.appRequest.is.group;
	}


	async run(ctx) {
		if(ctx.test)  return;
		
		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");

		const sender = await User.findAllById(ctx.from.id);

		if(!sender) {
			return ctx.telegram.sendMessage(ctx.from.id,`User not avaliable please /create`);
		}
		if(!sender.wallet) {
			return ctx.telegram.sendMessage(ctx.from.id,`No wallet avaliable`);
		}
		let wallet = sender.wallet;

		const result = await this.Coin.getBalance(ctx.from.id, wallet.id);

		if('error' in result) {
			return ctx.telegram.sendMessage(ctx.from.id,result.error);
		}
		
		wallet.balance = result.balance;
		wallet.unlock = result.unlocked_balance;
		wallet = await Wallet.update(wallet);

		
		const amount = sender.rain;

		const members = ctx.members.findAll();
		
		const destinations = [];
		let userNames = [];

		if(members.length <= 0) {
			return ctx.reply("No members avaliable");
		}

		for(let i =0;i< members.length;i++) {
			
			
			const user = User.findById(user_id);
			if(!user || !user.wallet) {
				continue;
			}

			userNames.push("@"+user.usernames);
			destinations.push({
				address:user.wallet.address,
				amount
			});
			
		}

		if(destinations.length <= 0) {
			return ctx.reply("No member have an account. /create everybody");
		}

		const send = amount*userNames;
		if(send > parseInt(wallet.unlock)) {
			return ctx.telegram.sendMessage(ctx.from.id,`Insufficient fund to ${members.length} total required ${this.Coin.format(send)}`);
		}
		const trx = await this.Coin.transferSubmitMany(ctx.from.id, wallet.id, destinations);
		if('error' in trx) {
			return ctx.reply(trx.error);
		}

		const balance = parseInt(wallet.balance) - parseInt(trx.amount) - parseInt(trx.fee);

		return ctx.telegram.sendMessage(ctx.from.id,`
			** Transaction Details **

			From: 
			${wallet.address}
			
			To: 
			${userNames.join(",")}
			
			Amount : ${this.Coin.format(trx.amount)}
			Fee : ${this.Coin.format(trx.fee)}
			Trx Hash: ${trx.tx_hash}
			Current Balance : ${this.Coin.format(balance)}
		`);
				


	}
}
module.exports = TransferCommand;
