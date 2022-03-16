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
        return await this.findById(user_id);
	}

	async getUsernameById(user_id) {
		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		const result = await global.redisClient.hget(ukey,'username');
		if(!result) {
        	return null;
		} 
		
		return result;
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
	
	async updateUsername(user_id, username) {
		const uKey = [global.config.coin, "Users" ,user_id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        let oldUsername = await global.redisClient.hget(uKey, username);

        return await global.redisClient.hset(uKey, 'username', username)
        .hdel(aKey, username)
        .hset(aKey, username, user_id)
        .exec();
	}


	async add(user_id, username) {
        const uKey = [global.config.coin, "Users" ,user_id].join(':');
        const aKey = [global.config.coin, "Alias"].join(':');

        let user = await this.findById(user_id);
                
		if(user && parseInt(user.user_id) === user_id) {
			
			if(user.wallet) {
				return  STATUS.ERROR_ACCOUNT_EXISTS;
	        }
	        user.status = STATUS.WALLET_REQUIRED;
			return  user;
        }
        const status = STATUS.WALLET_REQUIRED;
        user = {
        	user_id,
        	username,
        	status
        }
        	
    	let result = await global.redisClient.multi()
        .hmset(uKey, ["user_id",user_id,
        	"username",username,
        	"status",username])
        .hset(aKey, username, user_id)
        .exec();

       
        return user;
	}
}

module.exports = User;