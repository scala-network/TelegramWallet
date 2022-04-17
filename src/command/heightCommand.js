/**
 * A Telegram Command. Height basically returns daemon and wallet(s) height.
 * To return all heights do /height
 * To a height for a selected wallet at index do /height <index> eg. /height 3
 * @module Commands/height
 */
const Command = require('../base/command');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US');
const utils = require('../utils');

class HeightCommand extends Command {
	get description () {
		return 'Returns wallet and daemon height';
	}

	get name () {
		return 'height';
	}

	async run (ctx) {
		if (ctx.test) return;
		const Network = this.loadModel('Network');
		const result = await Network.lastHeight(this.Coin);

		let output = 'Coin ID :' + this.Coin.symbol + ' \n';
		output = 'Daemon height: ' + utils.formatNumber(result.height | 0) + ' \n';
		output += 'Sync Time: ' + timeAgo.format(parseInt(result.updated), 'round') + ' \n';
		const { id } = ctx.from;

		if (!ctx.appRequest.is.group) {
			const wallet = await this.loadModel('Wallet').findByUserId(id);
			if (wallet) {
				output += 'Wallet height: ' + utils.formatNumber(wallet.height | 0) + ' \n';
			} else {
				output += 'No wallet avaliable';
			}
		}

		ctx.appResponse.reply(output);
	}
}

module.exports = HeightCommand;
