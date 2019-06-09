const logSystem = "cmd/create";


module.exports = (ctx) => {

	const key = [global.config.redis.prefix,"Queue"].join(':');

	const n = (new Date()).getTime();

	redisClient.rpush(key, JSON.stringify({
    	'ctx' : {
    		'from' : ctx.from,
    		'chat' : ctx.chat,
    		'message' : ctx.message,
    		'arguments' : ctx.arguments,
    	},
    	'rpc' : 'create_wallet'
	}));
	
};