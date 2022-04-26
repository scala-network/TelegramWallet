'use strict';
/**
 * A Telegram Command. Rain send coins to latest active users.
  * @module Commands/rain
 */
const Command = require('../base/command');

class RainCommand extends Command {
	get name () {
		return 'rain';
	}

	get description () {
		return 'Send coins to latest active users. To set default rain value go to /set rain amount';
	}

	auth (ctx) {
		return ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		const Wallet = this.loadModel('Wallet');
		const User = this.loadModel('User');
		const Member = this.loadModel('Member');
		const Meta = this.loadModel('Meta');
		const Setting = this.loadModel('Setting');

		const sender = await User.findById(ctx.from.id);

		if (!sender) {
			return ctx.appResponse.reply('User account not avaliable. Please create a wallet https://t.me/' + global.config.bot.username);
		}

		if (!sender.wallet) {
			sender.wallet = Wallet.findByUserId(sender.user_id);

			if (!sender.wallet) {
				ctx.appResponse.reply('No wallet avaliable');
				return ctx.appResponse.sendMessage(ctx.from.id, 'No wallet avaliable');
			}
		}

		const wallet = await Wallet.syncBalance(ctx.from.id, sender.wallet, this.Coin);

		if (wallet && 'error' in wallet) {
			return ctx.appResponse.sendMessage(ctx.from.id, wallet.error);
		}
		if (!wallet) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'Wallet not avaliable please /create');
		}
		let rainValue = sender.rain;
		if (!rainValue) {
			rainValue = await Setting.findByFieldAndUserId('rain', ctx.from.id);
		}
		let rainMax = sender.rain_max;
		if (!rainMax) {
			rainMax = await Setting.findByFieldAndUserId('rain_max', ctx.from.id);
		}
		const amount = Setting.validateValue('rain', rainValue);
		rainMax = Setting.validateValue('rain_max', rainMax);

		const members = await Member.findByLast10(ctx.chat.id);
		if (rainMax <= 0) {
			rainMax = members.length;
		}
		const destinations = [];
		const userNames = [];

		if (members.length <= 0) {
			return ctx.appResponse.reply('No members avaliable');
		}

		const sentMemberIds = [];
		for (let i = 0; i < members.length; i++) {
			const userId = members[i];
			if (parseInt(userId) === parseInt(sender.user_id)) continue;

			const user = await User.findById(userId);

			if (!user || !user.wallet) {
				continue;
			}
			const username = user.username.trim();
			if(!username) continue;
			
			userNames.push('@' + username);
			sentMemberIds.push(userId);
			destinations.push({
				address: user.wallet.address,
				amount
			});
			if (userNames.length === rainMax) {
				break;
			}
		}

		if (destinations.length <= 0) {
			return ctx.appResponse.reply('No member with an account');
		}
		const estimate = amount * destinations.length * 1.02; // We assume the fee is 2%
		if (estimate > parseInt(wallet.unlock)) {
			ctx.appResponse.reply(`Insufficient fund to ${destinations.length} total required ${this.Coin.format(estimate)}`);
			return ctx.appResponse.sendMessage(ctx.from.id, `Insufficient fund to ${destinations.length} total required ${this.Coin.format(estimate)}`);
		}

		if (sender.rain_submit === 'enable') {
			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, false);
			if (!trx) {
				return ctx.appResponse.reply('Unable to connect with rpc. Please try again later');
			}
			if ('error' in trx) {
				return ctx.appResponse.reply('RPC Error: ' + trx.error);
			}
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const txHash = trx.tx_hash_list.join('\n* ');
			const balance = parseInt(wallet.balance) - parseInt(trxAmount) - parseInt(trxFee);
			const total = trxAmount + trxFee;
			const totalXla = this.Coin.format(total);
			await ctx.appResponse.reply('Airdrops to last ' + userNames.length + ' active members total of ' + totalXla + '\n' + userNames.join('\n'));
			await ctx.appResponse.sendMessage(ctx.from.id, `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
${userNames.join('\n')}

Amount : ${this.Coin.format(trxAmount)}
Fee : ${this.Coin.format(trxFee)}
Trx Hash: 
* ${txHash}
Current Balance : ${this.Coin.format(balance)}
			`);
			await Member.addNimbus(ctx.chat.id, '@' + sender.username, total);

			for (const i in sentMemberIds) {
				const smi = sentMemberIds[i];

				await Member.addWet(ctx.chat.id, userNames[i], amount);

				await ctx.appResponse.sendMessage(smi, `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
${userNames.join('\n')}

Amount : ${this.Coin.format(trxAmount)}
Fee : ${this.Coin.format(trxFee)}
Trx Hashes (${trx.amount_list.length} Transactions): 
* ${txHash}`);
			}
		} else {
			const trx = await this.Coin.transferMany(ctx.from.id, wallet.wallet_id, destinations, true);
			if (!trx) {
				return ctx.appResponse.reply('Unable to connect with rpc. Please try again later');
			}
			if ('error' in trx) {
				return ctx.appResponse.reply('RPC Error: ' + trx.error);
			}

			ctx.appResponse.reply('Airdrop confirmation require to ' + userNames.length + " active members total. To skip confirmation set rain_submit enable. Users don't get wet if have confirmation");

			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			// const txHash = trx.tx_hash_list.join('\n * ');
			// const balance = parseInt(wallet.balance) - parseInt(trxAmount) - parseInt(trxFee);
			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));

			return ctx.appResponse.sendMessage(ctx.from.id, `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
${userNames.join('\n')}
				
Amount : ${this.Coin.format(trxAmount)}
Fee : ${this.Coin.format(trxFee)}
Trx Meta ID: ${uuid}
Trx Expiry: ${global.config.rpc.metaTTL} seconds
Current Unlock Balance : ${this.Coin.format(wallet.balance)}
Number of transactions : ${trx.tx_hash_list.length}
To proceed with transaction run
Press button below to confirm`,
			{
				reply_markup: {
					inline_keyboard: [
						[{ text: 'Confirm?', callback_data: 'meta' }]
					],
					resize_keyboard: true,
					one_time_keyboard: true
				}
			});
		}
	}
}
module.exports = RainCommand;
