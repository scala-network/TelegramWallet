'use strict';
const Query = require('../../../base/query');
class Network extends Query {
	async lastHeight () {
		const key = [global.config.coin, 'network'].join(':');

		const result = await global.redisClient.hmget(key, ['height', 'updated']);

		if (!result) {
			return {
				height: 0
			};
		}
		return {
			height: result[0] ? parseInt(result[0]) : 0,
			updated: result[1] ? parseInt(result[1]) : 0
		};
	}

	async addHeight (height) {
		const key = [global.config.coin, 'network'].join(':');
		const updated = Date.now();
		return await global.redisClient.hmset(key, {
			height,
			updated
		});
	}
}

module.exports = Network;
