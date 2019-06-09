
const logSystem = "cmd/start";

module.exports = (ctx) => {

	const key = [global.config.redis.prefix,"Users",ctx.from.id].join(':');
	global.redisClient.hmget(key,['last_update','wallet_count', 'status'],(err, data) => {

		const n = (new Date()).getTime();

		let y = new Date(); // Today!
		y.setDate(y.getDate() - 7); // 7 Days ago!
		y = y.getTime();

		if(err) {
        	log('error', logSystem,'Error request %j', [err]);
        	ctx.hasError = err;
        	return;
		} 

		if(data[0] === null || parseInt(data[0]) > y || data[1] === null || data[1] == 0) {
		    ctx.reply('No wallet avaliable for account. Use command \n /create - To create a new wallet. \n /open <wallet_name> - To open a wallet. ');
			log('warning', logSystem,'No wallet for user %s id: %s', [ctx.from.username,ctx.from.id]);
		}
		
		return;

	});

	
};