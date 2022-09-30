'use strict';
const STATUS = require('../../../status');
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Setting extends Query {
	async updateField (userId, field, value, coin = 'xla') {
		const User = Model.LoadRegistry('User');


		const exists = await User.exists(userId);

		if (!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
		}

		const ukey = [coin, 'settings', userId].join(':');

		if (!~this.fields.indexOf(field)) {
			return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
		}

		await global.redisClient.hset(ukey, field, value);

		return STATUS.OK;
	}

	async findAllByUserId (userId, coin = 'xla') {
		const User = Model.LoadRegistry('User');

		const exists = await User.exists(userId);

		if (!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
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
			if(settings[i] !== null) results[field] = setting;
		}
		console.log(results);
		return results;
	}

	async findByFieldAndUserId (field, userId, coin = 'xla') {
		const User = Model.LoadRegistry('User');

		const exists = await User.exists(userId);

		if (!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
		}

		const ukey = [coin, 'settings', userId].join(':');

		const setting = await global.redisClient.hget(ukey, field);
		return setting || null;
	}
}

module.exports = Setting;
