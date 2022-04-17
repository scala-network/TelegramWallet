'use strict';
const Model = require('../base/model');

class Market extends Model {
	get fields () {
		return [
			'price',
			'volume_24h',
			'volume_change_24h',
			'percent_change_1h',
			'percent_change_24h',
			'percent_change_7d',
			'percent_change_30d',
			'market_cap',
			'market_cap_dominance',
			'fully_diluted_market_cap',
			'last_updated'
		];
	}

	get className () {
		return 'market';
	}

	async getLastUpdated (coin, options) {
		return await this.Query(options).getLastUpdated(coin);
	}

	async updateTicker (coin, ticker, market, options) {
		return await this.Query(options).updateTicker(coin, ticker, market);
	}

	async update (coin, dataStored, options) {
		return await this.Query(options).update(coin);
	}

	async getMarketExchange (coin, ticker, options) {
		return await this.Query(options).getMarketExchange(coin, ticker);
	}

	async getPrice (coin, options) {
		return await this.Query(options).getPrice(coin);
	}
}

module.exports = Market;
