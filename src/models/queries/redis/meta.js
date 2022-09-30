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
			.hmset(ukey, {uuid, meta, coin})
			.expire(ukey, ttl)
			.exec();
		return uuid;
	}

	async findById (userId, id) {
		const metaObject = await this.getByUserId(userId);
		if(!metaObject || metaObject.uuid !== id) return null;
		return metaObject;
	}

	async getByUserId (userId) {
		const ukey = ['xla:meta', userId].join(':');
		const metaObject = await global.redisClient.hgetall(ukey);
		if (!metaObject) return null;
		return metaObject;
	}

	async deleteMeta (userId, id) {
		const ukey = ['xla:meta', userId].join(':');
		const metaId = await global.redisClient.hget(ukey,'uuid');
		if(!metaId || metaId !== id) return null;
		await global.redisClient.del(ukey);
	}
}

module.exports = Meta;
