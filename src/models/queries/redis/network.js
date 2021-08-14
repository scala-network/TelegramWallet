
class Network {
	
	async lastHeight() {
		const key = [global.config.coin, 'network'].join(':');

		const result = await global.redisClient.hmget(key,['height','timestamp']);

		if(!result) {
        	return null;
		} 

		return {
			height: result[0]?result[0]:0,
			timestamp: result[1]?result[1]:0,
		};
	} 
}

module.exports = Network;