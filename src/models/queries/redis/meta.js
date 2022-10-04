'use strict';
const { v4: UUID } = require('uuid');
const Query = require('../../../base/query');
class Meta extends Query {
	async getId (userId, meta, coin) {
		const uuid = UUID();
		const ukey = ['xla:meta', userId].join(':');
		// const mkey = ['xla:meta:submit', userId].join(':');
		const ttl = global.config.rpc.metaTTL;
		await global.redisClient
			.multi()
			.hmset(ukey, { uuid, meta, coin})
			.expire(ukey, ttl)
			.exec();
		return uuid;
	}

	async findById (userId, id) {
		const metaObject = await this.getByUserId(userId);
		if (!metaObject || Object.keys(metaObject).length <= 0 || metaObject.uuid !== id ) return null;
		return metaObject;
	}

	async getByUserId (userId) {
		const ukey = ['xla:meta', userId].join(':');
		const metaObject = await global.redisClient.hgetall(ukey);
		if (!metaObject || Object.keys(metaObject).length <= 0) return null;
		return metaObject;
	}

	async deleteMeta (userId) {
		const ukey = ['xla:meta', userId].join(':');
		await global.redisClient.del(ukey);
	}
}

module.exports = Meta;
