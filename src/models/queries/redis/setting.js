'use strict';
const logSystem = "model/redis/setting";

const STATUS = require('../../../status');
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Setting  extends Query
{
	async updateField(id, field, value) {

		const User = Model.LoadRegistry('User');
		
		const ukey = [global.config.coin, 'Users' , id].join(':');

		const exists = await User.exists(id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        if(!~this.fields.indexOf(field)) {
        	return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
        }
		await global.redisClient.hset(ukey, field, value);
		
        return STATUS.OK;
	}

	async findAllByUserId(user_id) {
		const User = Model.LoadRegistry('User');
		
		const exists = await User.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		const settings = await global.redisClient.hmget(ukey, this.fields);

		if(!settings) {
			return {};
		}

		const results = {};
		for(let i = 0; i< this.fields.length;i++) {
			if(!(i in settings)){
				continue;
			}
			const setting = settings[i];
			if(!setting || setting.length <= 0) {
				continue;
			}
			const field = setting[0];
			if(!~this.fields.indexOf(field)) {
				continue;
			}

			results[field] = setting[1];
		}

		return results;

	}

	async findByFieldAndUserId(field,user_id) {
		const User = Model.LoadRegistry('User');
		
		const exists = await User.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

		const ukey = [global.config.coin, 'Users' , user_id].join(':');

		const setting = await global.redisClient.hget(ukey, field);
		return  setting ? setting : null;

	}

}

module.exports = Setting;