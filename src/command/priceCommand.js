'use strict'
/**
 * A Telegram Command. Info basically returns wallet and settings
 * information. To return execute do /info
 * @module Commands/height
 */
const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US');
const { Markup } = require('telegraf');

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

		if(ctx.appRequest.args.length >= 1) {
			const exchange = ctx.appRequest.args[0];
			if(global.config.market.tickers.indexOf(exchange.toUpperCase()) >= 0) {
				const marketExchange = await Market.getMarketExchange(this.Coin.symbol.toLowerCase(), exchange);
			
				output += "<b><u>" + exchange.toUpperCase() + " Market</u></b>\n"
				for(let [key, value] of Object.entries(marketExchange)) {
					output += key + " : ";
					if([
						"price"
					].indexOf(key) < 0) {
						output+=value;
					} else {
						output+= utils.fromExp(value);
					}
					if(["price"].indexOf(key) >= 0) {
						output +=' '+ exchange.toUpperCase() + "\n";
					} else if(key.startsWith("percent_")) {
						output += " %\n";
					} else {
						output += "\n";
					}
				}
			} else {
				output = "Invalid exchange ticker. Only " + global.config.market.tickers.join(",") + " are avaliable";
			}
			
		} else {
			const priceLists = await Market.getPrice(this.Coin.symbol.toLowerCase());

			if(priceLists) {
				output += "<b><u>Price Lists</u></b>\n"
				for(let [key, value] of Object.entries(priceLists)) {
					const priceTicker = key.toUpperCase();
					output += priceTicker + " : " + value +' '+ priceTicker + "\n";
				}	
			}
		}
		if(!output) {
			output+= "We have no response for market price";	
		} else {
			output += "\n Price exchanges are from https://coinmarketcap.com/currencies/" +this.Coin.fullname.toLowerCase();
		}
		ctx.appResponse.reply(output);

	}
}

module.exports = InfoCommand;
