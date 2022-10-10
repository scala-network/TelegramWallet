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
		return 'Send coins to latest active users. usages: /rain coin';
	}

	get fullDescription () {
		return `Sends airdrop to latest active users. To setup rain run /set`;
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

		const currentMeta = await Meta.getByUserId(ctx.from.id);
		if (currentMeta) {
			await ctx.appResponse.sendMessage(ctx.from.id,'Confirmations still pending. Unable to create new request');
			return await ctx.appResponse.reply( 'Unable to rain');
		}

		if (ctx.appRequest.args.length < 1) {
			return ctx.appResponse.reply(`Missing coin argument.\n${this.fullDescription}`);
		}

		const coin = ctx.appRequest.args[0];

 		if (!~global.config.coins.indexOf(coin)) {
 			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
 		}

		let wallet = await Wallet.findByUserId(sender.user_id, coin);

		if (!wallet) {
			ctx.appResponse.reply('No wallet avaliable');
			return ctx.appResponse.sendMessage(ctx.from.id, 'No wallet avaliable');
		}

		const coinObject = this.Coins.get(coin);
		wallet = await Wallet.syncBalance(ctx.from.id, wallet, coinObject).catch(e => console.log(e));

		if (wallet && 'error' in wallet) {
			return ctx.appResponse.sendMessage(ctx.from.id, wallet.error);
		}
		if (!wallet) {
			ctx.appResponse.reply(`No wallet avaliable for ${coin}`);
			return ctx.appResponse.sendMessage(ctx.from.id, `No wallet avaliable for ${coin} run /address to create one`);
		}
		
		let unlockBalance = 0;
		if ('unlock' in wallet) {
			unlockBalance = parseInt(wallet.unlock);
		} else {
			unlockBalance = parseInt(wallet.balance);
		}
		if('trading' in wallet) {
			unlockBalance -= wallet.trading;
		}
		if(unlockBalance <= 0) {
			ctx.appResponse.reply( `Unable to rain`);
			return ctx.appResponse.sendMessage(ctx.from.id,`No fund to process transaction`);
		}

		const setting = await Setting.findByFieldAndUserId(['rain', 'wet', 'rain_submit'], ctx.from.id, coin);
		let rainMax = Setting.validateValue('wet', setting.wet, coin);
		const amount = Setting.validateValue('rain', setting.rain, coin);
		const rainSubmit = await Setting.validateValue('rain_submit', setting.rain_submit, coin);

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

			if (!user) {
				continue;
			}
			const username = user.username.trim();
			if (!username) continue;
			const wallet = await Wallet.findByUserId(userId, coin);
			if (!wallet) continue;
			userNames.push('@' + username);
			sentMemberIds.push(userId);
			destinations.push({
				address: wallet.address,
				amount
			});
			if (userNames.length === rainMax) {
				break;
			}
		}

		if (destinations.length <= 0) {
			return ctx.appResponse.reply(`No members with ${coin} account`);
		}
		const totalAmount = amount * destinations.length;
		const estimateFee = await coinObject.estimateFee(wallet.wallet_id, destinations, false).catch(e => console.log(e.message));
		if(!estimateFee) {
			ctx.appResponse.reply(`Unable to rain`);
			return ctx.appResponse.sendMessage(ctx.from.id, `Unable to get estimated transaction fee`);
		}
		if(isNaN(estimateFee) && 'error' in estimateFee) {
			ctx.appResponse.reply(`Unable to rain`);
			return ctx.appResponse.sendMessage(ctx.from.id, `RPC Error : ${estimateFee.error}`);
		}

		const estimate = parseInt(totalAmount) + parseInt(estimateFee);
	    if (estimate > unlockBalance) {
			ctx.appResponse.reply( `Unable to rain`);
			return ctx.appResponse.sendMessage(ctx.from.id,`Insufficient fund to ${destinations.length} total required ${coinObject.format(estimate)}`);
		}

		const lock = rainSubmit === 'disable';

		const trx = await coinObject.transferMany(ctx.from.id, wallet.wallet_id, destinations, !lock);
		if (!trx) {
			ctx.appResponse.reply('Unable to rain');
			return ctx.appResponse.sendMessage(ctx.from.id, 'Unable to connect with rpc. Please try again later');
		}
		if ('error' in trx) {
			ctx.appResponse.reply('Unable to rain');
			return ctx.appResponse.sendMessage(ctx.from.id, 'RPC Error: ' + trx.error);
		}
		if (lock) {
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const txHash = trx.tx_hash_list.join('\n* ');
			const balance = parseInt(wallet.balance) - parseInt(trxAmount) - parseInt(trxFee);
			const total = trxAmount + parseInt(trxFee);
			const totalXla = coinObject.format(total);
			await ctx.appResponse.reply('Airdrops to last ' + userNames.length + ' active members total of ' + totalXla + '\n' + userNames.join('\n'));
			await ctx.appResponse.sendMessage(ctx.from.id, `
				<u>Transaction Details</u>

				From: 
				@${sender.username}

				To: 
				${userNames.join('\n')}

				Amount : ${coinObject.format(trxAmount)}
				Fee : ${coinObject.format(trxFee)}
				Trx Hash: 
				* ${txHash}
				Current Balance : ${coinObject.format(balance)}`);
			await Member.addNimbus(ctx.chat.id, '@' + sender.username, total, coin);

			for (const i in sentMemberIds) {
				const smi = sentMemberIds[i];

				await Member.addWet(ctx.chat.id, userNames[i], amount, coin);

				await ctx.appResponse.sendMessage(smi, `
					<u>Transaction Details</u>

					From: 
					@${sender.username}

					To: 
					${userNames.join('\n')}

					Amount : ${coinObject.format(trxAmount)}
					Fee : ${coinObject.format(trxFee)}
					Trx Hashes (${trx.amount_list.length}):
					* ${txHash}`);
			}
		} else {
			await ctx.appResponse.reply('Airdrop confirmation require to ' + userNames.length + " active members total. To skip confirmation set rain_submit disable. Stats not recorded if enabled");
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'), coin);

			const x = await ctx.appResponse.sendMessage(ctx.from.id, `
				<u>Transaction Details</u>

				From: 
				@${sender.username}

				To: 
				${userNames.join('\n')}

				Amount : ${coinObject.format(trxAmount)}
				Fee : ${coinObject.format(trxFee)}
				Number of transactions : ${trx.tx_hash_list.length}
				Trx Expiry: ${global.config.rpc.metaTTL} seconds
				Current Balance : ${coinObject.format(wallet.balance)}
				Unlock Balance : ${coinObject.format(unlockBalance)}
				Choose to confirm or cancel transaction`, this.Helper.metaButton());
			setTimeout(async () => {
				try{
					await ctx.telegram.deleteMessage(x.chat.id,x.message_id)
				}catch{
					return;
				}
				ctx.appResponse.sendMessage(ctx.from.id, "Transaction Action Timeout");

			}, global.config.rpc.metaTTL * 1000);
		}
	}
}
module.exports = RainCommand;
