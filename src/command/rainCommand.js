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
		return "Send coins to latest active users. To set default rain value go to /set rain <amount>";
	}

	auth(ctx) {
		return ctx.appRequest.is.group;
	}


	async run(ctx) {
		if(ctx.test)  return;
		
		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const Member = this.loadModel("Member");
		const Meta = this.loadModel("Meta");
		const Setting = this.loadModel("Setting");

		const sender = await User.findById(ctx.from.id);

		if(!sender) {
			return ctx.appResponse.reply("User account not avaliable. Please create a wallet https://t.me/" + global.config.bot.username);
		}
		
		if(!sender.wallet) {
			
			sender.wallet = Wallet.findByUserId(sender.user_id);
			
			if(!sender.wallet) {
				ctx.appResponse.reply(`No wallet avaliable`);
				return ctx.appResponse.sendMessage(ctx.from.id,`No wallet avaliable`);
			}
		}

		let wallet =await Wallet.syncBalance(ctx.from.id, sender.wallet, this.Coin);

		if(wallet && 'error' in wallet) {
			return ctx.appResponse.sendMessage(ctx.from.id, wallet.error);
		}
		if(!wallet) {
			return ctx.appResponse.sendMessage(ctx.from.id,`Wallet not avaliable please /create`);
		}
		let rain_value = sender.rain;
		if(!rain_value) {
			rain_value = await Setting.findByFieldAndUserId('rain', ctx.from.id);
		}
		let rain_max = sender.rain_max;
		if(!rain_max) {
			rain_max = await Setting.findByFieldAndUserId('rain_max', ctx.from.id);
		}
		const amount = Setting.validateValue('rain', rain_value);
		rain_max = Setting.validateValue('rain_max', rain_max);

		const members = await Member.findByLast10(ctx.chat.id);
		if(rain_max <= 0) {
			rain_max = members.length;
		}
		const destinations = [];
		let userNames = [];

		if(members.length <= 0) {
			return ctx.appResponse.reply("No members avaliable");
		}

		let more = 0;
		let sentMemberIds = [];
		for(let i =0;i< members.length;i++) {

			const user_id = members[i];
			if(parseInt(user_id) === parseInt(sender.user_id)) continue;

			const user = await User.findById(user_id);

			if(!user || !user.wallet) {
				continue;
			}
			userNames.push("@"+user.username);
			sentMemberIds.push(user_id);
			destinations.push({
				address:user.wallet.address,
				amount
			});
			if(userNames.length === rain_max) {
				break;
			}
		}

		if(destinations.length <= 0) {
			return ctx.appResponse.reply("No member with an account");
		}
		const estimate = amount * destinations.length * 1.02; //We assume the fee is 2%
		if(estimate > parseInt(wallet.unlock)) {
			ctx.appResponse.reply(`Insufficient fund to ${destinations.length} total required ${this.Coin.format(estimate)}`);
			return ctx.appResponse.sendMessage(ctx.from.id,`Insufficient fund to ${destinations.length} total required ${this.Coin.format(estimate)}`);
		}

		if(sender.rain_submit === 'enable') {
			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, false);
			if(!trx) {
				return ctx.appResponse.reply('Unable to connect with rpc. Please try again later');
			}
			if('error' in trx) {
				return ctx.appResponse.reply("RPC Error: " + trx.error);
			}
			const trx_fee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trx_amount = trx.amount_list.reduce((a, b) => a + b, 0);
			const tx_hash = trx.tx_hash_list.join("\n* ");
			const balance = parseInt(wallet.balance) - parseInt(trx_amount) - parseInt(trx_fee);
			const total = this.Coin.format(trx_amount + trx_fee);
			await ctx.appResponse.reply("Airdrops to last " + userNames.length + " active members total of " + total + "\n" + userNames.join("\n"));
			await ctx.appResponse.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
@${sender.username}

To: 
${userNames.join("\n")}

Amount : ${this.Coin.format(trx_amount)}
Fee : ${this.Coin.format(trx_fee)}
Trx Hash: 
* ${tx_hash}
Current Balance : ${this.Coin.format(balance)}
			`);

			for(let i in sentMemberIds) {
				let smi = sentMemberIds[i];

				await Member.addWet(ctx.chat.id, smi, amount);

				await ctx.appResponse.sendMessage(smi,`
** Transaction Details **

From: 
@${sender.username}

To: 
${userNames.join("\n")}

Amount : ${this.Coin.format(trx_amount)}
Fee : ${this.Coin.format(trx_fee)}
Trx Hashes (${trx.amount_list.length} Transactions): 
* ${tx_hash}
								`);

			}

		} else {


			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, true);
			if(!trx) {
				return ctx.appResponse.reply('Unable to connect with rpc. Please try again later');
			}
			if('error' in trx) {
				return ctx.appResponse.reply("RPC Error: " + trx.error);
			}

			ctx.appResponse.reply("Airdrop confirmation require to " + userNames.length + " active members total. To skip confirmation set rain_submit enable. Users don't get wet if have confirmation");


			const trx_fee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trx_amount = trx.amount_list.reduce((a, b) => a + b, 0);
			const tx_hash = trx.tx_hash_list.join("\n * ");
			const balance = parseInt(wallet.balance) - parseInt(trx_amount) - parseInt(trx_fee);
			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));

			return ctx.appResponse.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
@${sender.username}

To: 
${userNames.join("\n")}
				
Amount : ${this.Coin.format(trx_amount)}
Fee : ${this.Coin.format(trx_fee)}
Trx Meta ID: ${uuid}
Trx Expiry: ${global.config.rpc.metaTTL} seconds
Current Unlock Balance : ${this.Coin.format(wallet.balance)}
Number of transactions : ${trx.tx_hash_list.length}
To proceed with transaction run
/submit ${uuid} 
			`);
		}
	}
}
module.exports = TransferCommand;
