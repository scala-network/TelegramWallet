'use strict';
/**
 * A Telegram Command. Info basically returns wallet and settings
 * information. To return execute do /info
 * @module Commands/height
 */
const Command = require('../base/command');
const utils = require('../utils');

class PriceCommand extends Command {
	get needStart () {
		return false;
	}

	get name () {
		return 'price';
	}

	get description () {
		return 'Display current market price. With additional argument as ticker will send price changes for that ticker';
	}

	get fullDescription () {
		return `Display current market price. 
	- usage :/price coin
	- eg :/price xla
	For single exchange price append a ticker
	- usage :/price coin ticker
	- eg: /price xla btc`;
	}

	auth (ctx) {
		return true;
	}

	async run (ctx, callback) {
		if (ctx.test) return;
		const Market = this.loadModel('Market');
		let output = '';
		if (ctx.appRequest.args.length < 1) {
			return ctx.appResponse.reply(`Missing coin argument.\n${this.fullDescription} `);
		}

		const coin = ('' + ctx.appRequest.args[0]).trim().toLowerCase();
		const coinObject = this.Coins.get(coin);

		if (!~global.config.coins.indexOf(coin) || coin === 'vxla') {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}

		if (ctx.appRequest.args.length < 2) {
			const priceLists = await Market.getPrice(coin);

			if (priceLists) {
				output += '<u>Price Lists</u>\n';
				for (const [key, value] of Object.entries(priceLists)) {
					const priceTicker = key.toUpperCase();
					output += priceTicker + ' : ' + value + ' ' + priceTicker + '\n';
				}
			}
		} else if (ctx.appRequest.args.length < 3) {
			const exchange = ctx.appRequest.args[1].trim().toUpperCase();
			const rtick = global.coins[coin].market.tickers;
			if (rtick.indexOf(exchange.toUpperCase()) >= 0) {
				const marketExchange = await Market.getMarketExchange(coin, exchange);

				output += '<u>' + coin.toUpperCase() + '/' + exchange.toUpperCase() + ' Market</u>\n';
				for (const [key, value] of Object.entries(marketExchange)) {
					output += key + ' : ';
					if ([
						'price'
					].indexOf(key) < 0) {
						output += value;
					} else {
						output += utils.fromExp(value);
					}
					if (['price'].indexOf(key) >= 0) {
						output += ' ' + exchange.toUpperCase() + '\n';
					} else if (key.startsWith('percent_')) {
						output += ' %\n';
					} else {
						output += '\n';
					}
				}
			} else {
				output = 'Invalid exchange ticker. Only ' + rtick.join(',') + ' are avaliable';
			}
		}

		if (!output) {
			output += 'We have no response for market price';
		} else {
			const cmcName = (coinObject.cmcName) ? coinObject.cmcName : coinObject.fullname.toLowerCase();
			output += '\n Price exchanges are from https://coinmarketcap.com/currencies/' + cmcName;
		}
		ctx.appResponse.reply(output);
	}
}

module.exports = PriceCommand;
