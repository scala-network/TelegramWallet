'use strict';

const Model = require('../base/model');
const STATUS = require('../../../status');

class Network extends Model {
	get fields () {
		return [
			'height',
			'updated',
			'coin_id'
		];
	}

	get className () {
		return 'network';
	}

	async lastHeight (coin, options) {
		let result = await this.Query(options).lastHeight();

		const updated = Date.now();
		const step = updated - (global.config.rpc.interval * 1000);
		const height = result.height ? parseInt(result.height) : false;
		if (!height || !result.updated || parseInt(result.updated) <= step) {
			const resultFromCoin = await coin.getHeight();
			if (resultFromCoin === null) {
				return STATUS.ERROR_FETCHED_DAEMON;
			}
			const height = resultFromCoin.height;
			this.addHeight(height);
			result = {
				height,
				updated
			};
		}

		return result;
	}

	addHeight (height, options) {
		return this.Query(options).addHeight(height);
	}
}

module.exports = Network;
