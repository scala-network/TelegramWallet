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
	* */
	async addByUser (user, address, walletId, height, coin = 'xla') {
		const ukey = [global.config.coin, 'Users', user.user_id].join(':');

		const wallet = {
			address,
			balance: 0,
			user_id: user.user_id,
			updated: Date.now(),
			unlocked: 0,
			status: STATUS.WALLET_READY,
			coin_id: global.config.coin,
			wallet_id: walletId,
			height: height
		};

		await global.redisClient
			.hmset(ukey, ['wallet', JSON.stringify(wallet), 'status', user.status, 'wallet_id', walletId]);
		return wallet;
	}

	async update (userId, wallet, coin = 'xla') {
		const ukey = [coin, 'Users', userId].join(':');

		wallet.user_id = userId;
		wallet.updated = Date.now();
		wallet.status = STATUS.WALLET_READY;

		await global.redisClient
			.hmset(ukey, ['status', STATUS.WALLET_READY, 'wallet', JSON.stringify(wallet), 'wallet_id', wallet.wallet_id]);

		return wallet;
	}

	async findByUserId (userId, coins = null) {
		const ukey = ['xla', 'Users', userId].join(':');
		
		if(!coins) {
			coins = global.config.coins;	
		} else if(typeof coins === 'string') {
			coins = [coins];
		}

		const results = await global.redisClient.hmget(ukey, coins);
		if (!results) {
			return null;
		}
		let output = {};
		for(let i=0;i<coins.length;i++) {
			const c = coins[i];
			try {
				output[c] = JSON.parse(results[i]);
			} catch (e) {

			}
		}
		return output;
	}
}

module.exports = Wallet;
