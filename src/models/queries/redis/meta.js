'use strict';
const { v4: UUID } = require('uuid');
const Query = require('../../../base/query');
class Meta extends Query {
	async getId (userId, txMeta) {
		const uuid = UUID();
		const ukey = [global.config.coin, 'Meta', userId, uuid].join(':');
		const mkey = [global.config.coin, 'Submit', userId].join(':');

		await global.redisClient
			.multi()
			.setex(ukey, global.config.rpc.metaTTL, txMeta)
			.setex(mkey, global.config.rpc.metaTTL, uuid)
			.exec();
		return uuid;
	}

	async findById (userId, id) {
		const ukey = [global.config.coin, 'Meta', userId, id].join(':');
		const meta = await global.redisClient.get(ukey);
		return meta;
	}

	async getByUserId (userId, options) {
		const ukey = [global.config.coin, 'Submit', userId].join(':');
		const uuid = await global.redisClient.get(ukey);

		if (!uuid) return false;

		const mkey = [global.config.coin, 'Meta', userId, uuid].join(':');
		const meta = await global.redisClient.get(mkey);

		return meta;
	}

	async deleteMeta (userId, id) {
		const mkey = [global.config.coin, 'Meta', userId, id].join(':');
		const ukey = [global.config.coin, 'Submit', userId].join(':');
		await global.redisClient
			.multi()
			.del(ukey)
			.del(mkey)
			.exec();
	}
}

module.exports = Meta;
