'use strict';
/**
* A Telegram Command. Transfer sends coin to username.
* To return current wallets address do /tip <username>
* @module Commands/tip
*/
const Command = require('../base/command');

class TransferCommand extends Command {
	get name () {
		return 'tip';
	}

	get description () {
		return 'Tip coin to another user. Run /tip for more information';
	}

	get fullDescription () {
		return `Transfer coin to another user. 
		To setup default tipping value go to /set coin tip amount.
		Usages : /tip coin username custom_amount(optional)
		You can send a non default value by /tip coin username custom_amount (eg : /tip xla username 10)
		For multiple users /tip coin username1 username2 username3 username4 custom_amount`;
	}

	auth (ctx) {
		return true;
	}

	async run (ctx) {
		if (ctx.test) return;

		const Wallet = this.loadModel('Wallet');
		const User = this.loadModel('User');
		const Meta = this.loadModel('Meta');
		const Setting = this.loadModel('Setting');
		const sender = await User.findById(ctx.from.id);

		if (!sender) {
			return ctx.appResponse.reply('User account not avaliable. Please create a wallet https://t.me/' + global.config.bot.username);
		}

		const currentMeta = await Meta.getByUserId(ctx.from.id);

		if (currentMeta) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'Confirmations still pending. Unable to create new request');
		}

		if (ctx.appRequest.args.length < 1) {
			return ctx.appResponse.reply(`Missing coin argument\n${this.fullDescription}`);
		}
		let coin = ('' + ctx.appRequest.args[0]).trim().toLowerCase();
		if (!coin) {
			coin = 'xla';
		}
		if (!~global.config.coins.indexOf(coin)) {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}
		const coinObject = this.Coins.get(coin);
		let wallet = await Wallet.findByUserId(ctx.from.id, coin);
		wallet = await Wallet.syncBalance(ctx.from.id, wallet, coinObject);
		if(!wallet) {
			return ctx.appResponse.reply(`No wallet avaliable for coin ${coin}`);
		}
		if (wallet && 'error' in wallet) {
			return ctx.sendMessage(ctx.from.id, wallet.error);
		}
		let unlock = 'unlock' in wallet ? wallet.unlock : wallet.balance;
		if ('trading' in wallet) {
			unlock -= wallet.trading;
		}
		if (0 >= parseFloat(unlock)) {
			return ctx.appResponse.sendMessage(ctx.from.id, `No fund to process transaction`);
		}


		const args = [].concat(ctx.appRequest.args);
		args.shift();

		let tipAmount = args[args.length - 1];
		if (isNaN(tipAmount)) {
			tipAmount = await Setting.findByFieldAndUserId('tip', ctx.from.id, coin);
		} else {
			args.pop();
			tipAmount = coinObject.parse(tipAmount);
		}
		tipAmount = Setting.validateValue('tip', tipAmount, coin);
		if (tipAmount < global.coins[coin].settings.tip_min || tipAmount > global.coins[coin].settings.tip_max) {
			return ctx.appResponse.sendMessage(ctx.from.id, `Tip amount exceed min (${coinObject.format(global.coins[coin].settings.tip_min)}) or max (${coinObject.format(global.coins[coin].settings.tip_max)})`);
		}
		const estimate = await coinObject.estimateFee(wallet.wallet_id,[{amount:tipAmount,address:wallet.address}],false).catch(e => console.log(e.message));
		if(!estimate) {
			return ctx.appResponse.reply(`Unable to get estimated transaction fee`);
		}
		if(isNaN(estimate) && 'error' in estimate) {
			ctx.appResponse.reply(`Unable to rain`);
			return ctx.appResponse.reply(`RPC Error : %s`, estimate.error);
		}

		if (estimate > parseFloat(unlock)) {
			return ctx.appResponse.reply(`Insufficient fund estimate require ${coinObject.format(estimate)}`);
		}
		const destinations = [];
		const userIds = [];
		const invalids = {
			user: [],
			wallet: [],
			// fails: []
		};
		for (const _uname of args) {
			if (!_uname || !_uname.trim()) continue;
			let username = _uname.trim();
			if (username.startsWith('@')) {
				username = username.substr(1);
			}
			if (username === sender.username) continue;

			const user = await User.findByUsername(username);
			if (!user || !('user_id' in user)) {
				invalids.user.push(username);
				continue;
			}
			const rwallet = await Wallet.findByUserId(user.user_id, coin);
			if (!rwallet) {
				invalids.wallet.push(user.user_id);
				continue;
			}

			if ('error' in rwallet) {
				invalids.wallet.push({ username, error: rwallet.error });
				continue;
			}

			userIds.push(user);
			destinations.push({
				amount: tipAmount,
				address: rwallet.address
			});
		}
		if (destinations.length < 1) {
			return await ctx.appResponse.reply(`Invalid tip to no users with ${coin.toUpperCase()} wallet or linked`);
		}
		const tipSubmit = await Setting.findByFieldAndUserId('tip_submit', ctx.from.id);
		const confirms = tipSubmit === 'enable';
		const trx = await coinObject.transferMany(ctx.from.id, wallet.wallet_id, destinations, confirms);
		if (!trx) {
			return await ctx.appResponse.reply('No response from  RPC');
		}
		if ('error' in trx) {
			return await ctx.appResponse.reply('Error RPC: ' + trx.error);
		}

		if (confirms) {
			const ftrxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const ftrxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			const uuid = await Meta.getId(ctx.from.id,trx.tx_metadata_list.join(':'),coin);

			const x = await ctx.appResponse.sendMessage(ctx.from.id, `
				<u>Pending Transaction Details</u>

				<b>From:</b> 
				@${sender.username}

				<b>To:</b> 
				@${userIds.map(u => u.username).join('\n@')}

				<b>Tip Amount :</b>  ${coinObject.format(ftrxAmount)}
				<b>Fee :</b>  ${coinObject.format(ftrxFee)}
				<b>Trx Meta ID :</b>  ${uuid}
				<b>Trx Expiry :</b>  ${global.config.rpc.metaTTL} seconds
				<b>Current Unlock Balance :</b>  ${coinObject.format(unlock)}
				<b>Number of transactions :</b>  ${trx.tx_hash_list.length}
 				Choose to confirm or cancel transaction`, this.Helper.metaButton());
			setTimeout(async () => {

				try{
					await ctx.telegram.deleteMessage(x.chat.id,x.message_id)
				}catch{
					return;
				}
				ctx.appResponse.sendMessage(ctx.from.id, "Transaction Action Timeout");

			}, global.config.rpc.metaTTL * 1000);
			} else {
				const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
				const txHash = trx.tx_hash_list.join('\n * ');
				const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
				await ctx.appResponse.sendMessage(ctx.from.id, `
					<u>Transaction Details</u>

					From: 
					@${sender.username}

					To: 
					@${userIds.map(u => u.username).join('\n@')}

					Amount : ${coinObject.format(trxAmount)}
					Fee : ${coinObject.format(trxFee)}
					Number of transactions : ${trx.amount_list.length}
					Trx Hashes (${trx.tx_hash_list.length}): 
					* ${txHash}`);
				const template = `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
@${userIds.map(u => u.username).join('\n@')}

Amount : ${coinObject.format(trxAmount)}
Fee : ${coinObject.format(trxFee)}
Number of transactions : ${trx.amount_list.length}
Trx Hashes (${trx.tx_hash_list.length}): 
* ${txHash}`;

				for (const u of userIds) await ctx.appResponse.sendMessage(u.user_id, template);
			}
		let msg = '';
		for (const [key, objects] of Object.entries(invalids)) {
			for(let value of objects){
				switch (key) {
					case 'user':
					msg += `\n* Username ${value} is not linked to ${coin}`;
					break;
					case 'wallet':
					await ctx.appResponse.sendMessage(value, `Somebody tried to tip you but no ${coin} wallet found. Run /address to create one`);
					break;
					// case 'fails':
					// msg += `\n* Trying to send to  ${value.username} fails. Error : ${value.error}`;
					// break;
				}
			}
		}
		if (msg) {
			await ctx.appResponse.sendMessage(ctx.from.id, `<u><b>Tip Error Log</b></u>\n${msg}`);
		}
	}
}

module.exports = TransferCommand;
