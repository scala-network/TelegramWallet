'use strict';
/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /tip <username>
 * @module Commands/tip
 */
const Command = require('../base/command');
const STATUS = require('../status');

class TransferCommand extends Command {
	get name () {
		return 'tip';
	}

	get description () {
		return 'Tip coin to another user. To set default tip value go to /set tip amount (usages : /tip username) or you can custom tip /tip username custom_amount';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		if (ctx.appRequest.args.length <= 0) {
			return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
		}

		const Wallet = this.loadModel('Wallet');
		const User = this.loadModel('User');
		const Meta = this.loadModel('Meta');
		const Setting = this.loadModel('Setting');
		const sender = await User.findById(ctx.from.id);

		if (!sender || sender === STATUS.ERROR_ACCOUNT_NOT_EXISTS) {
			return ctx.appResponse.reply('User account not avaliable. Please create a wallet https://t.me/' + global.config.bot.username);
		}

		if (!('wallet' in sender) || sender === STATUS.ERROR_WALLET_NOT_AVALIABLE) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'No wallet avaliable');
		}

		const wallet = await Wallet.syncBalance(ctx.from.id, sender.wallet, this.Coin);
		if (wallet && 'error' in wallet) {
			return ctx.sendMessage(ctx.from.id, wallet.error);
		}

		let tipAmount = ctx.appRequest.args[ctx.appRequest.args.length -1];
		const amount = Setting.validateValue('tip', tipAmount);// Assuming 2% XLA transaction fee

		if (amount !== tipAmount) {
			tipAmount = this.Coin.parse(amount);
		} else {
			tipAmount = await Setting.findByFieldAndUserId('tip', ctx.from.id);
		}
		const estimate = amount * 1.01;// Assuming 1% XLA transaction fee

		if (estimate > parseFloat(wallet.unlock)) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'Insufficient fund estimate require ' + this.Coin.format(estimate));
		}
		const destinations = [];
		let totalTips = 0;
		const userIds = [];

		for (const _uname of ctx.appRequest.args) {
			let username = _uname.trim();
			if (username.startsWith('@')) {
				username = username.substr(1);
			}

			const user = await User.findByUsername(username);

			if (!user || !('user_id' in user) || user === STATUS.ERROR_ACCOUNT_NOT_EXISTS) continue;

			if (!('wallet' in user) || user === STATUS.ERROR_WALLET_NOT_AVALIABLE) continue;

			totalTips += tipAmount;
			userIds.push(user);
			destinations.push({
				amount : tipAmount,
				address: user.wallet.address
			});
		}

		const confirms = destinations.length > 1 || (sender.tip_submit !== 'enable');

		if (confirms) {
			const trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, destinations, true);
			if (!trx) {
				return ctx.appResponse.reply('No response from  RPC');
			}
			if ('error' in trx) {
				return ctx.appResponse.reply(trx.error);
			}

			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));
			// const ftrxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const ftrxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			return ctx.appResponse.sendMessage(ctx.from.id, `
<u>Transaction Details</u>

<b>From:</b> 
@${sender.username}

<b>To:</b> 
@${userIds.map(u => u.username).join('\n@')}

<b>Tip Amount :</b>  ${this.Coin.format(totalTips)}
<b>Fee :</b>  ${this.Coin.format(ftrxFee)}
<b>Trx Meta ID :</b>  ${uuid}
<b>Trx Expiry :</b>  ${global.config.rpc.metaTTL} seconds
<b>Current Unlock Balance :</b>  ${this.Coin.format(wallet.balance)}
<b>Number of transactions :</b>  ${trx.tx_hash_list.length}
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
		} else {
			const trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, destinations, false);
			if ('error' in trx) {
				return ctx.appResponse.reply(trx.error);
			}
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const txHash = trx.tx_hash_list.join('\n * ');
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			// const balance = parseInt(wallet.balance) - parseInt(trxAmount) - parseInt(trxFee);
			await ctx.appResponse.sendMessage(ctx.from.id, `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
@${userIds.map(u => u.username).join('\n@')}

<b>Tip Amount :</b>  ${this.Coin.format(trxAmount)}
Fee : ${this.Coin.format(trxFee)}
Current Unlock Balance : ${this.Coin.format(wallet.balance)}
Number of transactions : ${trx.tx_hash_list.length}
			`);
			const template = `
<u>Transaction Details</u>

From: 
@${sender.username}

To: 
@${userIds.map(u => u.username).join('\n@')}

Amount : ${this.Coin.format(trxAmount)}
Fee : ${this.Coin.format(trxFee)}
Number of transactions : ${trx.tx_hash_list.length}
Trx Hashes (${trx.amount_list.length} Transactions): 
* ${txHash}`;

			for (const u of userIds) await ctx.appResponse.sendMessage(u.user_id, template);
		}
	}
}

module.exports = TransferCommand;
