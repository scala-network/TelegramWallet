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

  		let coin;
  		if (ctx.appRequest.args.length >= 1) {
  			coin = (''+ctx.appRequest.args[0]).trim().toLowerCase();
  		}
  		if(!coin) {
  			coin = 'xla';
  		}
  		if(!~global.config.coins.indexOf(coin)) {
  			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
  		}


  		let wallet = await Wallet.findByUserId(sender.user_id, coin);

  		if (!wallet) {
  			ctx.appResponse.reply('No wallet avaliable');
  			return ctx.appResponse.sendMessage(ctx.from.id, 'No wallet avaliable');
  		}

  		const coinObject = this.Coins.get(coin);
  		wallet = await Wallet.syncBalance(ctx.from.id, wallet, coinObject);

  		if (wallet && 'error' in wallet) {
  			console.log("Error di sini");
  			return ctx.appResponse.sendMessage(ctx.from.id, wallet.error);
  		}
  		if (!wallet) {
  			ctx.appResponse.reply(`No wallet avaliable for ${coin}`);
  			return ctx.appResponse.sendMessage(ctx.from.id, `No wallet avaliable for ${coin} run /address to create one`);
  		}
  		let rainValue = await Setting.findByFieldAndUserId('rain', ctx.from.id, coin);
  		let rainMax = await Setting.findByFieldAndUserId('wet', ctx.from.id, coin);
  		let rain_submit = await Setting.findByFieldAndUserId('rain_submit', ctx.from.id, coin);
  		rainMax = Setting.validateValue('wet', rainMax, coin);
  		const amount = Setting.validateValue('rain', rainValue, coin);
  		rain_submit = await Setting.validateValue('rain_submit', rain_submit, coin);


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
  			if(!username) continue;
  			const wallet = await Wallet.findByUserId(userId, coin);
  			if(!wallet) continue;
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
  			return ctx.appResponse.reply('No member with an account');
  		}
  		const getfee = await coinObject.getFee();

  		if(coin !== 'lunc') {
  			const estimate = amount * destinations.length * getfee;
			let unlockBalance = 0;
			if('unlock' in wallet) {
				unlockBalance = parseInt(wallet.unlock);
			} else {
				unlockBalance = parseInt(wallet.balance);
			}
			if (estimate > unlockBalance) {
				ctx.appResponse.reply(`Insufficient fund to ${destinations.length} total required ${coinObject.format(estimate)}`);
				return ctx.appResponse.sendMessage(ctx.from.id, `Insufficient fund to ${destinations.length} total required ${coinObject.format(estimate)}`);
			}
  		}
		
  		const lock = rain_submit !== 'enabled';
		
		const trx = await coinObject.transferMany(ctx.from.id, wallet.wallet_id, destinations, lock);
		if (!trx) {
			ctx.appResponse.reply('Unable to rain');
			return ctx.appResponse.sendMessage(ctx.from.id,'Unable to connect with rpc. Please try again later');
		}
		if ('error' in trx) {
			ctx.appResponse.reply('Unable to rain');
			return ctx.appResponse.sendMessage(ctx.from.id,'RPC Error: ' + trx.error);
		}

		if (lock) {
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const txHash = trx.tx_hash_list.join('\n* ');
			const balance = parseInt(wallet.balance) - parseInt(trxAmount) - parseInt(trxFee);
			const total = trxAmount + trxFee;
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
				Current Balance : ${coinObject.format(balance)}
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

					Amount : ${coinObject.format(trxAmount)}
					Fee : ${coinObject.format(trxFee)}
					Trx Hashes (${trx.amount_list.length} Transactions): 
					* ${txHash}`);
			}
		} else {

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
				
				Amount : ${coinObject.format(trxAmount)}
				Fee : ${coinObject.format(trxFee)}
				Trx Meta ID: ${uuid}
				Trx Expiry: ${global.config.rpc.metaTTL} seconds
				Current Unlock Balance : ${coinObject.format(wallet.balance)}
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
