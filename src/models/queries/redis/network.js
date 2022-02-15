const Query = require('../../../base/query');
const Model = require('../../../base/model');
class Network  extends Query
{
	
	async lastHeight() {

		const key = [global.config.coin, 'network'].join(':');

		const result = await global.redisClient.hmget(key,['height','updated']);

		if(!result) {
        	return {};
		}

		return {
			height: result[0]?result[0]:0,
			updated: result[1]?parseInt(result[1]):0,
		};
	} 

	async addHeight(height) {
		const key = [global.config.coin, 'network'].join(':');

		return await global.redisClient.hmset(key,[
			'height', height,
			'updated',  Date.now()
		]);

	} 
}

module.exports = Network;