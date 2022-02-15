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
			
			sender.wallet = Wallet.findById(sender.user_id);
			
			if(!sender.wallet) {
				return ctx.telegram.sendMessage(ctx.from.id,`No wallet avaliable`);
			}
		}

		let wallet =await Wallet.syncBalance(ctx, sender.wallet, this.Coin);
		
		if(!sender.rain) {
			sender.rain = Settings.findByFieldAndUserId('rain', ctx.from.id);
		}
		
		const amount = sender.rain;

		const members = Member.findByLast10(ctx.chat.id);
		
		const destinations = [];
		let userNames = [];

		if(members.length <= 0) {
			return ctx.reply("No members avaliable");
		}
		let more = 0;
		for(let i =0;i< members.length;i++) {
			const user_id = members.user_id;
			
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
			return ctx.reply("No member with an account");
		}

		const send = amount * destinations.length;
		if(send > parseInt(wallet.unlock)) {
			return ctx.telegram.sendMessage(ctx.from.id,`Insufficient fund to ${destinations.length} total required ${this.Coin.format(send)}`);
		}

		if(sender.rain_submit === 'enabled') {
			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, false);

			if('error' in trx) {
				return ctx.reply(trx.error);
			}
	
			const balance = parseInt(wallet.balance) - parseInt(trx.amount) - parseInt(trx.fee);
	
			return ctx.telegram.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
${wallet.address}

To: 
@${userNames.join("\n@")}

Amount : ${this.Coin.format(trx.amount)}
Fee : ${this.Coin.format(trx.fee)}
Trx Hash: ${trx.tx_hash}
Current Balance : ${this.Coin.format(balance)}
			`);
		} else {
			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, true);
			if('error' in trx) {
				return ctx.reply(trx.error);
			}

			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata);

			return ctx.telegram.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
${wallet.address}

To: 
@${userNames.join("\n@")}
				
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
}
module.exports = TransferCommand;
