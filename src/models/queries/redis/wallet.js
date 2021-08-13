const STATUS = require('../../../status');


class Wallet {
	
	async addWalletByUserId(id, address, height) {
		const ukey = [global.config.coin, 'Users' ,id].join(':');
		const wkey = [global.config.coin, 'Wallets' ,id].join(':');

		await global.redisClient.multi()
		.rpush(wkey, JSON.parse({
			height,
			address,
			balance:0,
			user_id:id,
			last_sync:Math.floor(new Date().getTime() / 1000),
			unlocked:0,
			status:STATUS.WALLET_READY
		}))
		.exec();

	}
}

module.exports = Wallet;