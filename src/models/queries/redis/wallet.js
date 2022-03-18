'use strict';
const STATUS = require('../../../status');
const { v4: UUID } = require('uuid');
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Wallet  extends Query
{
	/**
	 * addByUser
	 * 
	 * user - The user object
	 * address - The wallet address
	 * heightOrIndex - In SWM heightOrIndex is the index of the address
	 * */
	async addByUser(user, address, wallet_id, height) {
		const ukey = [global.config.coin, 'Users' , user.user_id].join(':');

		const wallet = {
			address,
			balance:0,
			user_id:user.user_id,
			updated:Date.now(),
			unlocked:0,
			status:STATUS.WALLET_READY,
			coin_id : global.config.coin,
			wallet_id,
			height: height
		};

		const result = await global.redisClient
		.hmset(ukey ,['wallet',JSON.stringify(wallet), "status", user.status,"wallet_id", wallet_id]);
		return wallet;
	}

	async update(user_id, wallet) {
		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		wallet.user_id = user_id;
		wallet.updated = Date.now();
		wallet.status = STATUS.WALLET_READY;
	
		await global.redisClient
		.hmset(ukey, ["status",  STATUS.WALLET_READY,"wallet",  JSON.stringify(wallet), 'wallet_id', wallet.wallet_id]);
		
		return wallet;

	}

	async findByUserId(user_id) {
		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		const results = await global.redisClient.hget(ukey, 'wallet');
		if(!results) {
        	return null;
		} 

		let wallet = {};
		if(results) {
			try{
				wallet = JSON.parse(results);
			} catch(e) {

			}
		}
		
		return wallet;
	}

}

module.exports = Wallet;