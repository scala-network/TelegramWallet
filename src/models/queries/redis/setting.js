const STATUS = require('../../../status');

const logSystem = "model/redis/setting";
const Query = require('../BaseQuery');


class Setting  extends Query
{
	async updateField(id, field, value) {
		const ukey = [global.config.coin, 'Users' , id].join(':');
		const exists = await this.exists(id);
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }
        if(!~properties.indexOf(field)) {
        	return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
        }
		const user = await global.redisClient.hset(ukey, field, value);

        if(!result) {
        	return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        return STATUS.OK;
	}

}

module.exports = Setting;