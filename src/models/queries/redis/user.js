'use strict';
const STATUS = require('../../../status');
const Query = require('../../../base/query');
class User extends Query {
	async updateField (id, field, value) {
		const ukey = [global.config.coin, 'Users', id].join(':');

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
		const aKey = [global.config.coin, 'Alias'].join(':');
		const userId = await global.redisClient.hget(aKey, username);
		if (!userId) {
			return null;
		}
		return await this.findById(userId);
	}

	async getUsernameById (userId) {
		const ukey = [global.config.coin, 'Users', userId].join(':');

		const result = await global.redisClient.hget(ukey, 'username');
		if (!result) {
			return null;
		}

		return result;
	}

	async findById (userId) {
		const ukey = [global.config.coin, 'Users', userId].join(':');

		const results = await global.redisClient.hgetall(ukey);
		if (!results) {
			return null;
		}
		if (results.wallet) {
			try {
				results.wallet = JSON.parse(results.wallet);
			} catch (e) {

			}
		}

		return results;
	}

	async exists (userId) {
		const ukey = [global.config.coin, 'Users', userId].join(':');

		const result = await global.redisClient.hget(ukey, 'user_id');
		return (result !== null && `${result}` === `${userId}`);
	}

	async remove (userId, username) {
		const uKey = [global.config.coin, 'Users', userId].join(':');
		const aKey = [global.config.coin, 'Alias'].join(':');

		await global.redisClient.multi()
			.del(uKey)
			.hdel(aKey, username)
			.exec();

		return STATUS.OK;
	}

	async updateUsername (userId, username) {
		const uKey = [global.config.coin, 'Users', userId].join(':');
		const aKey = [global.config.coin, 'Alias'].join(':');

		const oldUsername = await global.redisClient.hget(uKey, 'username');

		return await global.redisClient
			.multi()
			.hset(uKey, 'username', username)
			.hdel(aKey, oldUsername)
			.hset(aKey, username, userId)
			.exec();
	}

	async add (userId, username) {
		const uKey = [global.config.coin, 'Users', userId].join(':');
		const aKey = [global.config.coin, 'Alias'].join(':');

		let user = await this.findById(userId);

		if (user && parseInt(user.user_id) === userId) {
			if (user.wallet) {
				return STATUS.ERROR_ACCOUNT_EXISTS;
			}
			user.status = STATUS.WALLET_REQUIRED;
			return user;
		}
		const status = STATUS.WALLET_REQUIRED;
		user = {
			user_id: userId,
			username,
			status
		};

		await global.redisClient.multi()
			.hmset(uKey, ['user_id', userId,
				'username', username,
				'status', username])
			.hset(aKey, username, userId)
			.exec();

		return user;
	}
}

module.exports = User;
