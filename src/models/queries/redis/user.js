const STATUS = require('../../../status');


class User {
	
	async findWithWalletsAndDaemonHeightById(id) {
		const key = [global.config.coin, 'daemon' ,'height'].join(':');
		const ukey = [global.config.coin, 'Users' ,id].join(':');
		const wkey = [global.config.coin, 'Wallets' ,id].join(':');

		const results = await global.redisClient.multi()
		.get(key)
		.hget(ukey,'selected')
		.lrange(wkey,[0,-1])
		.exec();

		if(!results) {
        	return null;
		} 

		let wallets = [];
		if(results[1]) {
			wallets = JSON.parse(results[1]);
		}
		return {
			height: results[0],
			user : { selected : results[1] },
			wallets
		};

	}

	async findAllWithWalletsById(id) {
		const ukey = [global.config.coin, 'Users' , id].join(':');
		const wkey = [global.config.coin, 'Wallets', id].join(':');

		const results = await global.redisClient
		.multi()
		.hgetall(ukey)
		.lrange(wkey,[0,-1])
		.exec();

		if(!results || !results[0]) {
        	return null;
		} 
		let wallets = [];
		if(results[1]) {
			try{
				wallets = JSON.parse(results[1]);
			} catch(e) {

			}
		}

		
		return { user : results[0], wallets };

	}

	async findWithWalletsById(id) {
		const ukey = [global.config.coin, 'Users' , id].join(':');
		const wkey = [global.config.coin, 'Wallets', id].join(':');

		const results = await global.redisClient
		.multi()
		.hget(ukey, 'selected')
		.lrange(wkey,[0,-1])
		.exec();

		if(!results) {
        	return null;
		} 

		let wallets = [];
		if(results[1]) {
			try{
				wallets = JSON.parse(results[1]);
			} catch(e) {

			}
		}
		return { selected : results[0], wallets };

	}
	async remove(id, username, password) {
		const wkey = [global.config.coin, "Wallets" ,id].join(':');
        const uKey = [global.config.coin, "Users" ,id].join(':');
        const aKey = [global.config.coin, "Alias" ,username].join(':');

        await global.redisClient.multi()
        .hdel(uKey)
        .del(aKey)
        .del(wkey)
        .exec();

        return STATUS.OK;

	}

	async createWithWallet(id, username, password) {
		const wkey = [global.config.coin, "Wallets" ,id].join(':');
        const uKey = [global.config.coin, "Users" ,id].join(':');
        const aKey = [global.config.coin, "Alias" ,username].join(':');

        const results = await global.redisClient.multi()
        .hmget(uKey,['username','status'])
        .llen(wkey)
        .exec();
        const walletCount = results[1]?results[1]:0;
        let status = STATUS.REQUEST_NEW_USER;
        
        if(results[0][0] === null) {

            await global.redisClient.multi()
            .hmset(aKey,[
            	username, id
            ])
            .hmset(uKey,[
                'status', status,
                'username',username,
                'id',id,
                'selected', 0
            ])
            .exec();

        }
                    
        if(walletCount >= this.MaxWalletUser) {
            return STATUS.ERROR_WALLET_CREATE_EXCEED;
        }

        if(results[0][1] != STATUS.NONE) {
            return STATUS.ERROR_REQUEST_PENDING;
        }

        return STATUS.OK;
	}
}

module.exports = User;