'use strict';
const { v4: UUID } = require('uuid');
const STATUS = require('../../../status');
const Query = require('../../../base/query');
class Meta  extends Query
{
	async getId(user_id, tx_meta) {
		const uuid = UUID();
		const ukey = [global.config.coin, 'Meta', user_id, uuid].join(':');
		const mkey = [global.config.coin, 'Submit', user_id].join(':');
		
		await global.redisClient
		.multi()
		.setex(ukey, global.config.rpc.metaTTL, tx_meta);
		.setex(mkey, global.config.rpc.metaTTL, uuid);
		.exec();
		return uuid;
	}

	async findById(user_id, id) {
		const ukey = [global.config.coin, 'Meta', user_id, id].join(':');
		const meta = await global.redisClient.get(ukey);
		return meta;

	}

	async getByUserId(user_id, options) {
		
		const ukey = [global.config.coin, 'Submit', user_id].join(':');	
		const uuid = await global.redisClient.get(ukey);

		if(!uuid) return false;
		
		const mkey = [global.config.coin, 'Meta', user_id, id].join(':');
		const meta = await global.redisClient.get(mkey);

		return meta;
	}

	async deleteMeta(user_id, id) {
		const mkey = [global.config.coin, 'Meta', user_id, id].join(':');
		const ukey = [global.config.coin, 'Submit', user_id].join(':');
		await global.redisClient
		.multi()
		.del(ukey)
		.del(mkey)
		.exec();
	}
}

module.exports = Meta;

