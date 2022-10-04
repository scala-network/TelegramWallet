'use strict';
const STATUS = require('../../../status');
const Query = require('../../../base/query');

class Wallet extends Query {
	/**
	* addByUser
	*
	* user - The user object
	* address - The wallet address
	* heightOrIndex - In SWM heightOrIndex is the index of the address
	* coin_id - The symbol for wallet's coin
	* */
	async addByUser (user, address, walletId, height, coinId = 'xla') {
		const ukey = ['xla:Users', user.user_id].join(':');

		const wallet = {
			address,
			balance: 0,
			user_id: user.user_id,
			updated: Date.now(),
			unlocked: 0,
			trading: 0,
			coin_id: coinId,
			wallet_id: walletId,
			height: height
		};

		await global.redisClient
			.hmset(ukey, [coinId, JSON.stringify(wallet), coinId + '_id', walletId]);
		return wallet;
	}

	async update (userId, wallet) {
		const ukey = ['xla:Users', userId].join(':');

		wallet.updated = Date.now();
		await global.redisClient.hset(ukey, wallet.coin_id, JSON.stringify(wallet));
		return wallet;
	}

	async findByUserId (userId, _coins = null) {
		const ukey = ['xla:Users', userId].join(':');
		let single = false;
		let coins = [];
		if (!_coins) {
			coins = [].concat(global.config.coins);
		} else if (typeof _coins === 'string') {
			single = true;
			coins.push(_coins);
		}

		const results = await global.redisClient.hmget(ukey, coins);
		if (!results) {
			return null;
		}
		const output = {};
		for (let i = 0; i < coins.length; i++) {
			const c = coins[i];
			try {
				output[c] = JSON.parse(results[i]);
			} catch (e) {

			}
		}
		if (single) {
			return _coins in output ? output[_coins] : null;
		}
		return output;
	}
}

module.exports = Wallet;
