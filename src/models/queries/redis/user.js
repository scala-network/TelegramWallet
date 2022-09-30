'use strict';
const STATUS = require('../../../status');
const Query = require('../../../base/query');
class User extends Query {
	async updateField (id, field, value) {
		const ukey = ['xla:Users', id].join(':');

		if (!~this.fields.indexOf(field)) {
			return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
		}

		const user = await global.redisClient.hset(ukey, field, value);

		if (!user) {
			return STATUS.ERROR_MODEL_UPDATE;
		}

		return STATUS.OK;
	}

	async findByUsername (username) {
		const aKey = 'xla:Alias';
		const userId = await global.redisClient.hget(aKey, username);
		if (!userId) {
			return null;
		}
		return await this.findById(userId);
	}

	async getUsernameById (userId) {
		const ukey = ['xla:Users', userId].join(':');

		const result = await global.redisClient.hget(ukey, 'username');
		if (!result) {
			return null;
		}

		return result;
	}

	async findById (userId) {
		const ukey = ['xla:Users', userId].join(':');
		const lookUpKeys = ['status','username','user_id'];
		const results = await global.redisClient.hmget(ukey,lookUpKeys);
		if (!results) {
			return null;
		}
		const output = {};
		for(let i=0;i<lookUpKeys.length;i++) {
			const key = lookUpKeys[i];
			const value =results[i];
			if(!value) return null;
			output[key] = value;
		}

		return output;
	}

	async exists (userId) {
		const ukey = ['xla:Users', userId].join(':');

		const result = await global.redisClient.hget(ukey, 'user_id');
		return (result !== null && `${result}` === `${userId}`);
	}

	async remove (userId, username) {
		const uKey = ['xla:Users', userId].join(':');
		const aKey = 'xla:Alias';

		await global.redisClient.multi()
			.del(uKey)
			.hdel(aKey, username)
			.exec();

		return STATUS.OK;
	}

	async updateUsername (userId, username) {
		const uKey = ['xla:Users', userId].join(':');
		const aKey = 'xla:Alias';

		const oldUsername = await global.redisClient.hget(uKey, 'username');

		return await global.redisClient
			.multi()
			.hset(uKey, 'username', username)
			.hdel(aKey, oldUsername)
			.hset(aKey, username, userId)
			.exec().catch(e => console.log(e));
	}

	async add (userId, username) {
		const uKey = ['xla:Users', userId].join(':');
		const aKey = 'xla:Alias';

		let user = await this.findById(userId);

		if (user) {
			return user;
		}
		user = {
			user_id: userId,
			username,
		};

		await global.redisClient.multi()
			.hmset(uKey, [
				'user_id', userId,
				'username', username,
			])
			.hset(aKey, username, userId)
			.exec();

		return user;
	}
}

module.exports = User;
