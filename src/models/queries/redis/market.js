'use strict';
const Query = require('../../../base/query');
const utils = require('../../../utils');

class Market extends Query {
	async getLastUpdated (coin) {
		const key = [coin, 'price'].join(':');
		const lastUpdated = global.redisClient.hget(key, 'last_updated');
		return lastUpdated;
	}

	async updateTicker (coin, ticker, market) {
		const tick = ticker.toLowerCase();
		const key = [coin, 'price'].join(':');
		return await global.redisClient
			.hmset(key,
				[tick, JSON.stringify(market)], [tick + '_price', market.price], ['last_updated', Date.now()]
			);
	}

	async getMarketExchange (coin, ticker) {
		const key = [coin, 'price'].join(':');
		const tick = ticker.toLowerCase();
		const market = await global.redisClient.hget(key, tick);
		if (market) {
			return JSON.parse(market);
		}
		return {};
	}

	async getPrice (coin) {
		const key = [coin, 'price'].join(':');
		const tickers = global.config.market.tickers;
		const result = {};
		for (const ticker of tickers) {
			const tick = ticker.toLowerCase();
			const price = await global.redisClient
				.hget(key, tick + '_price');
			if (price) {
				result[tick] = utils.fromExp(price);
			}
		}
		return result;
	}
}

module.exports = Market;
