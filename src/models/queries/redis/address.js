const STATUS = require('../../../status');
const Query = require('../../../base/query');
class Address extends Query
{

	async findByUserId(user_id) {
		const key = [global.config.coin, 'Addresses'].join(':');

		const result = await global.redisClient.hget(key,`${user_id}`);

		if(!result) {
        	return null;
		} 

		return result;
	}
}


module.exports = Address;