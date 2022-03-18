'use strict';
const logSystem = "model/redis/market";

const Query = require('../../../base/query');


class Market  extends Query
{
	
	async getLastUpdated(coin) {
		const key = [coin,'price'].join(':');
		const lastUpdated = global.redisClient.hget(key, 'last_updated');
		return lastUpdated;
	}

	async updateTicker(coin, ticker, market) {
		const key = [coin,'price'].join(':');
		return await global.redisClient
		.multi()
		.hmset(key, ticker, JSON.stringify(market))
		.hmset(key, ticker+'_price', market.price)
		.hset(key, 'last_updated', Date.now())
		.exec();
		
	}

	async update(coin, dataStored) {
		const key = [coin,'price'].join(':');

		for(const[ticker, market] of Object.entries(dataStored)) {
			await global.redisClient
			.multi()
			.hmset(key, ticker, JSON.stringify(market))
			.hmset(key, ticker+'_price', market.price)
			.exec();
		}
		await global.redisClient.hset(key, 'last_updated', Date.now());
		return;
	}

	async getMarketExchange(coin, ticker) {
		const key = [coin,'price'].join(':');

		const market = await global.redisClient.hget(key, ticker);
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
			const price = await global.redisClient
			.hget(key, ticker+"_price");
			if(price) {
				result[ticker] = price;
			}
		}
		return result;
	}

}

module.exports = Market;