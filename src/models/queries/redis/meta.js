'use strict';
const { v4: UUID } = require('uuid');
const STATUS = require('../../../status');
const Query = require('../../../base/query');
class Meta  extends Query
{
	async getId(user_id, tx_meta) {
		const uuid = UUID();
		const ukey = [global.config.coin, 'Meta', user_id, uuid].join(':');
		await global.redisClient.setex(ukey, global.config.rpc.metaTTL, tx_meta);
		return uuid;
	}

	async findById(id, user_id) {
		const ukey = [global.config.coin, 'Meta', user_id, id].join(':');
		const meta = await global.redisClient.get(ukey);
		return meta;

	}
}

module.exports = Meta;

