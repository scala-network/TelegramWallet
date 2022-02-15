const STATUS = require('../../../status');

const logSystem = "model/redis/user";
const Query = require('../../../base/query');
class User  extends Query
{
	async updateField(id, field, value) {
		
		const ukey = [global.config.coin, 'Users' , id].join(':');
		
		if(!~this.fields.indexOf(field)) {
        	return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
        }

		const user = await global.redisClient.hset(ukey, field, value);

        if(!user) {
        	return STATUS.ERROR_MODEL_UPDATE;
        }

        return STATUS.OK;
	}


	async findByUsername(username) {
        const aKey = [global.config.coin, "Alias"].join(':');

        const user_id = await global.redisClient.hget(aKey, username);

        if(!user_id) {
        	return null;
        }

        return await this.findAllById(user_id);

	}

	async findById(user_id) {
		
		const ukey = [global.config.coin, 'Users' , user_id].join(':');

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

	async exists(user_id) {
		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		const result = await global.redisClient.hget(ukey, 'user_id');
		return (result !== null && `${result}` === `${user_id}`);
	}

	async remove(user_id, username) {
        const uKey = [global.config.coin, "Users" ,user_id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        await global.redisClient.multi()
        .del(uKey)
        .hdel(aKey, username)
        .exec();

        return STATUS.OK;
	}

	async add(user_id, username) {
        const uKey = [global.config.coin, "Users" ,user_id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        const exists = await this.exists(user_id);
		if(exists) {
			return STATUS.ERROR_ACCOUNT_EXISTS;
        }
        const insert = [
        	'user_id',user_id,
        	'username', username,
        	'status' , STATUS.WALLET_REQUIRED
        ];


    	let result = await global.redisClient.multi()
        .hmset(uKey, insert)
        .hset(aKey,[
        	username, user_id
        ])
        .hgetall(uKey)
        .exec();
        if(!result[2]) {
        	global.log("error",logSystem, "Error %j => %j",[result, insert]);
        	return STATUS.ERROR_CREATE_ACCOUNT;
        }
        return result[2][1];
	}
}

module.exports = User;