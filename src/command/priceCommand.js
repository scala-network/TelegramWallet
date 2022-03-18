'use strict'
/**
 * A Telegram Command. Info basically returns wallet and settings
 * information. To return execute do /info
 * @module Commands/height
 */
const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US')
class InfoCommand extends Command {

	get enabled() {
		return 'market' in global.config && 'tickers' in global.config.market && global.config.market.tickers.length > 0;
	}

	get name() {
		return "price";
	}

	get description() {
		return "Display current market price. With additional argument as ticker will send price changes for that ticker. Avaliable ticker btc, ltc, usd and euro. ";
	}

	auth(ctx) {
		return true;
	}

	async run(ctx, callback) {
		if (ctx.test) return;
		const Market = this.loadModel("Market");
		let output = "";

		if(ctx.appRequest.args.length > 0) {
			const exchange = ctx.appRequest.args[0];
			if(global.config.market.tickers.indexOf(exchange.toLowerCase()) >= 0) {
				const marketExchange = await Market.getMarketExchange(this.Coin.symbol, exchange);
			
				output += "*** " + exchange.toUpperCase() + " Market ***\n"
				for(let [key, value] of Object.entries(marketExchange)) {
					output += key + " : " + value + exchange.toUpperCase() + "\n";
				}
				output += "\n Price exchanges are from https://coinmarketcap.com/currencies/" +this.Coin.fullname;
			} else {
				output = "Invalid exchange ticker. Only " + global.config.market.tickers.join(",") + " are avaliable";
			}
			
		} else {
			const priceLists = await Market.getPrice(this.Coin.symbol);

			
			output += "*** Price Lists ***\n"
			for(let [key, value] of Object.entries(priceLists)) {
				const priceTicker = key.toUpperCase();
				output += priceTicker + " : " + value + priceTicker + "\n";
			}
			output += "\n Price exchanges are from https://coinmarketcap.com/currencies/" +this.Coin.fullname;

		}
		if(!output) {
			output+= "We have no response for market price";	
		}

	}
}

module.exports = InfoCommand;
