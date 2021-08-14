const STATUS = require('../../../status');


class Wallet {
	/**
	 * addByUser
	 * 
	 * user - The user object
	 * address - The wallet address
	 * heightOrIndex - In SWM heightOrIndex is the index of the address
	 * */
	async addByUser(user, address, heightOrIndex) {
		const ukey = [global.config.coin, 'Users' , user.id].join(':');
        const wKey = [global.config.coin, "AddressAlias"].join(':');

		const wallet = {
			address,
			balance:0,
			user_id:user.id,
			last_sync:Date.now(),
			unlocked:0,
			status:STATUS.WALLET_READY
		};

		if(global.config.swm) {
			wallet.id = heightOrIndex;
			wallet.height = 0;
		} else {
			wallet.id = 0;
			wallet.height = heightOrIndex;
		}

		const result = await global.redisClient
		.multi()
		.hmset(ukey, [	
			["status",  STATUS.WALLET_READY],
			["wallet",  JSON.stringify(wallet)],
			["wallet_id", global.config.swm?heightOrIndex:0]
		])
		.hset(wKey, [
			user.username,
			global.config.swm?heightOrIndex:wallet.address
		])
		.hgetall(ukey)
		.exec();

		return result;

	}

	async update(wallet) {
		const ukey = [global.config.coin, 'Users' , wallet.user_id].join(':');

		wallet = Object.assign(wallet, {
			user_id: wallet.user_id,
			last_sync:Date.now(),
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
		let wallets;
		if(result[1]) {
			try{
				wallets = JSON.parse(result[1]);
			} catch(e) {
				wallets = null;
			}
		}
		return wallets;

	}

	async findByUserId(id) {
		const ukey = [global.config.coin, 'Users' , id].join(':');

		const results = await global.redisClient.hget(ukey, 'wallet');

		if(!results) {
        	return null;
		} 

		let wallets = [];
		if(results) {
			try{
				wallets = JSON.parse(results);
			} catch(e) {

			}
		}
		
		return wallets;
	}
}

module.exports = Wallet;