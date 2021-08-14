
class Network {
	
	async lastHeight() {
		const key = [global.config.coin, 'network'].join(':');

		const result = await global.redisClient.hmget(key,['height','timestamp']);

		if(!result) {
        	return null;
		}

		return {
			height: result[0]?result[0]:0,
			timestamp: result[1]?parseInt(result[1]):0,
		};
	} 

	async addHeight(height) {
		const key = [global.config.coin, 'network'].join(':');

		return await global.redisClient.hmset(key,[
			'height', height,
			'timestamp',  Date.now()
		]);

	} 
}

module.exports = Network;