'use strict';
const logSystem = "model/redis/market";

const Query = require('../../../base/query');
function convert(n){
	        var sign = +n < 0 ? "-" : "",
		            toStr = n.toString();
	        if (!/e/i.test(toStr)) {
			            return n;
			        }
	        var [lead,decimal,pow] = n.toString()
	            .replace(/^-/,"")
	            .replace(/^([0-9]+)(e.*)/,"$1.$2")
	            .split(/e|\./);
	        return +pow < 0 
	            ? sign + "0." + "0".repeat(Math.max(Math.abs(pow)-1 || 0, 0)) + lead + decimal
	            : sign + lead + (+pow >= decimal.length ? (decimal + "0".repeat(Math.max(+pow-decimal.length || 0, 0))) : (decimal.slice(0,+pow)+"."+decimal.slice(+pow)))
	    }

class Market  extends Query
{
	
	async getLastUpdated(coin) {
		const key = [coin,'price'].join(':');
		const lastUpdated = global.redisClient.hget(key, 'last_updated');
		return lastUpdated;
	}

	async updateTicker(coin, ticker, market) {
		const tick = ticker.toLowerCase();
		const key = [coin,'price'].join(':');
		return await global.redisClient
		.multi()
		.hmset(key, tick, JSON.stringify(market))
		.hmset(key, tick +'_price', market.price)
		.hset(key, 'last_updated', Date.now())
		.exec();
		
	}

	async update(coin, dataStored) {
		const key = [coin,'price'].join(':');

		for(const[ticker, market] of Object.entries(dataStored)) {
			const tick = ticker.toLowerCase();
			await global.redisClient
			.multi()
			.hmset(key, tick, JSON.stringify(market))
			.hmset(key, tick+'_price', market.price)
			.exec();
		}
		await global.redisClient.hset(key, 'last_updated', Date.now());
		return;
	}

	async getMarketExchange(coin, ticker) {
		const key = [coin,'price'].join(':');
		const tick = ticker.toLowerCase();
		const market = await global.redisClient.hget(key, tick);
		if(market) {
			return JSON.parse(market);
		}
		return {};
	}

	async getPrice(coin) {
		const key = [coin,'price'].join(':');
		const tickers = global.config.market.tickers;
		const result = {};
		for(const ticker of tickers) {
			const tick = ticker.toLowerCase();
			const price = await global.redisClient
			.hget(key, tick +"_price");
			if(price) {
				result[tick] = convert(price);
			}
		}
		return result;
	}

}

module.exports = Market;
