'use strict';
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Setting extends Query {
	async updateField (userId, field, value, coin = 'xla') {
		const User = Model.LoadRegistry('User');

		const exists = await User.exists(userId);

		if (!exists) {
			return { error: "User doesn't exists" };
		}

		const ukey = [coin, 'settings', userId].join(':');

		if (!~this.fields.indexOf(field)) {
			return { error: 'Invalid field' };
		}

		await global.redisClient.hset(ukey, field, value);

		return true;
	}

	async findAllByUserId (userId, coin = 'xla') {
		const User = Model.LoadRegistry('User');

		const exists = await User.exists(userId);

		if (!exists) {
			return { error: "User doesn't exists" };
		}

		const ukey = [coin, 'settings', userId].join(':');

		const settings = await global.redisClient.hmget(ukey, this.fields);
		if (!settings) {
			return {};
		}

		const results = {};
		for (let i = 0; i < this.fields.length; i++) {
			const setting = settings[i];
			const field = this.fields[i];
			if (settings[i] !== null) results[field] = setting;
		}
		return results;
	}

	async findByFieldAndUserId (field, userId, coin = 'xla') {
		const User = Model.LoadRegistry('User');

		const exists = await User.exists(userId);

		if (!exists) {
			return { error: "User doesn't exists" };
		}

		const ukey = [coin, 'settings', userId].join(':');
		let setting = {};
		if (Array.isArray(field)) {
			const result = await global.redisClient.hmget(ukey, field);
			for (let i = 0; i < field.length; i++) {
				const f = field[i];
				setting[f] = result[i];
			}
			if (Object.keys(setting).length <= 0) {
				setting = null;
			}
		} else {
			setting = await global.redisClient.hget(ukey, field);
		}
		return setting || null;
	}
}

module.exports = Setting;
