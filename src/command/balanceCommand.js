'use strict';
/**
 * A Telegram Command. Balance returns wallet balance.
 * @module Commands/balance
 */

const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US');

class BalanceCommand extends Command {
	get name () {
		return 'balance';
	}

	get description () {
		return 'Returns all wallet(s) balance';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		const Wallet = this.loadModel('Wallet');

		const oldWallet = await Wallet.findByUserId(ctx.from.id);
		let output = '<u>Wallet Information</u>\n';

		if (oldWallet) {
			for(let [coin,details] of oldWallet) {
				let wallet;
				let coinObject = this.Coins.get(coin);
				const syncWallet = await Wallet.syncBalance(ctx.from.id, details, coinObject);
				if (syncWallet && 'error' in syncWallet) {
					wallet = details;
				} else {
					wallet = syncWallet;
				}

				output += `Coin ID: ${wallet.coin_id}\n`;
				output += `Balance: ${utils.formatNumber(coinObject.format(wallet.balance || 0))}\n`;
				if(wallet.unlock)
				output += `Unlocked Balance: ${utils.formatNumber(coinObject.format(wallet.unlock || 0))}\n`;
				output += `Last Sync: ${timeAgo.format(parseInt(wallet.updated || 0), 'round')}\n`;
				output += `Last Height: ${utils.formatNumber(wallet.height || 0)}\n`;

				if ('pending' in wallet && wallet.pending > 0) {
					output += `Confirmations Remaining: ${wallet.pending}\n`;
				}

				output += "===================================";
			}
		} else {
			output += 'No wallet avaliable';
		}

		ctx.appResponse.reply(output);
	}
}

module.exports = BalanceCommand;
