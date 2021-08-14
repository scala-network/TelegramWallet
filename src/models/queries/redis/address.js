const STATUS = require('../../../status');

class Address
{

	async add(id, index) {
		
		const key = [global.config.coin, 'Addresses'].join(':');

		const result = await global.redisClient
		.multi()
		.hset(key,[
			`${id}`, `${index}`
		]).
		hget(key,`${id}`)
		.exec();

		if(!result || !result[1]) {
        	return null;
		} 

		return (result[1] === `${index}`) ? STATUS.OK : null;

	}


	async findByUserId(id) {
		const key = [global.config.coin, 'Addresses'].join(':');

		const result = await global.redisClient.hget(key,`${id}`);

		if(!result) {
        	return null;
		} 

		return result;
	}
}


module.exports = Address;