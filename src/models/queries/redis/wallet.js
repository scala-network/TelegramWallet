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
        const wKey = [global.config.coin, "AddressAlias"].join(':');

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
		const hmset = [
			"status",  STATUS.WALLET_READY,
			"wallet",  JSON.stringify(wallet),
			"wallet_id", wallet_id
		];
		const result = await global.redisClient
		.multi()
		.hmset(ukey, hmset)
		.hset(wKey, 
			user.username,
			address
		)
		.exec();
		return wallet;

	}

	async update(wallet) {
		const ukey = [global.config.coin, 'Users' , wallet.user_id].join(':');

		wallet = Object.assign(wallet, {
			user_id: wallet.user_id,
			updated:Date.now(),
			status:STATUS.WALLET_READY
		});

		const result = await global.redisClient
		.multi()
		.hmset(ukey, [	
			["status",  STATUS.WALLET_READY],
			["wallet",  JSON.stringify(wallet)]
		])
		.hmget(ukey,"wallet")
		.exec();

		if(result[1]) {
			try{
				wallet = JSON.parse(result[1]);
			} catch(e) {
				
			}
		}
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