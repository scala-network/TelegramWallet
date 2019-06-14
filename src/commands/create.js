const logSystem = "cmd/create";

module.exports = {
    enabled:true,
    run: (ctx) => {
        if(ctx.aRequest.is.group && !ctx.aRequest.is.admin) {

            ctx.reply('Unavaliable. Currently only for admins');
            return;
        }
        
    	const key = [global.config.redis.prefix,"Queue"].join(':');

    	const n = (new Date()).getTime();

    	redisClient.rpush(key, JSON.stringify({
        		'from' : ctx.from,
        		'chat' : ctx.chat,
        		'message' : ctx.message,
                request: ctx.aRequest
    	}));

        ctx.reply('Create wallet request has been send');
    },

    notify:(data,callback) => {
        let msg = "Your wallet has been created\n";
        msg += " Address: "+ data.wallet.address +"\n";
        msg += " Balance: "+ data.wallet.balance +"\n";
        callback(null,data.from.id, msg);
    }
	
};
