'use strict';
/**
 * A Telegram Command. Balance returns wallet balance.
 * @module Commands/balance
 */

const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US');
const logSystem = 'command/balance';

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
		let output = '<u>Wallet Balance</u>\n\n';

		if (oldWallet) {
			for (const [coin, details] of Object.entries(oldWallet)) {
				if (!details) continue;
				let wallet;
				const coinObject = this.Coins.get(coin);
				const syncWallet = await Wallet.syncBalance(ctx.from.id, details, coinObject);

				if (syncWallet && !('error' in syncWallet)) {
				// } else {
					wallet = syncWallet;
				}else {
					wallet = details;
					global.log('error', logSystem, 'RPC (%s) error %j',[coin, ('error' in syncWallet) ? syncWallet.error : syncWallet]);
				}

				output += `Coin ID: ${coinObject.symbol}\n`;
				output += `Balance: ${coinObject.format(wallet.balance || 0)}\n`;
				let unlock = wallet.balance;
				if ('unlock' in wallet) {
					unlock = wallet.unlock;
				}
				if ('trading' in wallet) {
					output += `Trade Locked: ${coinObject.format(wallet.trading || 0)}\n`;
					unlock -= wallet.trading;
				}
				output += `Unlocked Balance: ${coinObject.format(unlock || 0)}\n`;
				output += `Last Sync: ${timeAgo.format(parseInt(wallet.updated || 0), 'round')}\n`;
				output += `Last Height: ${utils.formatNumber(wallet.height || 0)}\n`;

				if ('pending' in wallet && wallet.pending > 0) {
					output += `Confirmations Remaining: ${wallet.pending}\n`;
				}

				output += '\n';
			}
		} else {
			output += 'No wallet avaliable';
		}

		ctx.appResponse.reply(output);
	}
}

module.exports = BalanceCommand;
