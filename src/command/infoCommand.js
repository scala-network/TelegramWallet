'use strict';
/**
 * A Telegram Command. Info basically returns wallet and settings
 * information. To return execute do /info
 * @module Commands/height
 */
const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US');

class InfoCommand extends Command {
	get name () {
		return 'info';
	}

	get description () {
		return 'Returns information about your profile and wallets';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	enabled = true;

	async run (ctx, callback) {
		if (ctx.test) return;

		const User = this.loadModel('User');
		const Wallet = this.loadModel('Wallet');
		const result = await User.findById(ctx.from.id);

		if (!result) {
			return ctx.appResponse.reply('User account not avaliable. Please create a wallet https://t.me/' + global.config.bot.username);
		}

		// const totalBalance = 0;
		let output = '';
		output += '<b><u>User\'s Information</u></b>\n\n';
		for (const field of User.fields) {
			output += `${field} : ${result[field]}\n`;
		}

		output += '\n<u><b>Wallet Information</b></u>\n\n';

		const wallets = await Wallet.findByUserId(ctx.from.id);
		for (const [coin, wallet] of Object.entries(wallets)) {
			const coinObject = this.Coins.get(coin);
			if (wallet) {
				output += `Coin ID : ${coin}\n`;
				output += `Address : \n${wallet.address}\n`;

				output += `Balance : ${utils.formatNumber(coinObject.format(wallet.balance || 0))}\n`;
				let unlock = wallet.balance;
				if ('unlock' in wallet) {
					unlock = wallet.unlock;
				}
				if ('trading' in wallet) {
					output += `Trade Lock : ${utils.formatNumber(wallet.trading || 0)}\n`;
					unlock -= wallet.trading;
				}
				output += `Unlock : ${utils.formatNumber(coinObject.format(unlock || 0))}\n`;
				output += `Last Sync: ${timeAgo.format(parseInt(wallet.updated || 0), 'round')}\n\n`;
			} else {
				output += 'No wallet avaliable\n';
			}
		}

		ctx.appResponse.reply(output);
	}
}

module.exports = InfoCommand;
