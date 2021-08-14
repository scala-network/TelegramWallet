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
			last_sync:Math.floor(new Date().getTime() / 1000),
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