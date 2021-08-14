const STATUS = require('../../../status');

const logSystem = "model/redis/user";

class User {
	
	async findByUsername(username) {
        const aKey = [global.config.coin, "Alias"].join(':');
		const ukey = [global.config.coin, 'Users' , id].join(':');

        const user_id = await global.redisClient.hget(aKey);

        if(!result) {
        	return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        return await this.findAllById(user_id);

	}

	async findAllById(id) {
		const ukey = [global.config.coin, 'Users' , id].join(':');

		const results = await global.redisClient.hgetall(ukey);
		if(!results) {
        	return null;
		} 

		if(results.wallet) {
			try{
				results.wallet = JSON.parse(results.wallet);
			} catch(e) {

			}
		}
		return results;
	}

	async exists(id) {
		const ukey = [global.config.coin, 'Users' , id].join(':');

		const result = await global.redisClient.hget(ukey, 'id');

		return (result !== null && `${result}` === `${id}`);
	}

	async remove(id, username) {
        const uKey = [global.config.coin, "Users" ,id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        await global.redisClient.multi()
        .del(uKey)
        .hdel(aKey, username)
        .exec();

        return STATUS.OK;
	}

	async add(id, username) {
        const uKey = [global.config.coin, "Users" ,id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        const exists = await this.exists(id);
		if(exists) {
			return STATUS.ERROR_ACCOUNT_EXISTS;
        }
        const insert = [
        	'id',id,
        	'username', username,
        	'status' , STATUS.WALLET_REQUIRED
        ];
    	let result = await global.redisClient.multi()
        .hmset(uKey, insert)
        .hset(aKey,[
        	username, id
        ])
        .hgetall(uKey)
        .exec();
                    
        if(!result[2]) {
        	global.log("error",logSystem, "Error %j => %j",[result, insert]);
        	return STATUS.ERROR_CREATE_ACCOUNT;
        }

        return result[2];
	}
}

module.exports = User;