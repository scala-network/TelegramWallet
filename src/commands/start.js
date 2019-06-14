/**
 * A Telegram Command. Start basically do what it says.
 * To start off do /start
 * @module Commands/start
 */

const logSystem = "commands/start";

const onRunUser = (ctx,callback) =>{
	const key = [global.config.redis.prefix, "Wallets" ,ctx.from.id].join(':');
	global.redisClient.llen(key,(err, data) => {

		if(err) {
        	callback(err);
        	return;
		} 

		global.redisClient.hmset([global.config.redis.prefix, "Users" ,ctx.from.id].join(':'),[
			'username',ctx.from.username,
			'id',ctx.from.id
		],function(error) {
			if(error) {
				callback(error);
			}

			if(data == 0) {

			    ctx.reply('No wallet avaliable for account. Avaliable commands \n\
				/height - Returns daemon height. \n\
				/create - Create a new wallet. We will not ask for your default wallet. \n\
			    	');

				log('warning', logSystem,'No wallet for user %s id: %s', [ctx.from.username,ctx.from.id]);

			} else {
				ctx.reply(data + ' wallet avaliable for this account. Avaliable commands \n\
				/height - Returns daemon height. \n\
				/balance - Returns daemon height. \n\
				/history  - Show wallet histories. \n\
				/info - Returns daemon height. \n\
				/send <xtc address> <amount>  - Returns daemon height. \n\
				/tip @username <amount>  - Returns daemon height. \n\
				/donate <amount>  - Give some love to the devs. \n\
			    	');
			}

			callback(null);	
		});
//		    	/create - To create a new wallet. \n\
//		    	/balance - To check a wallets balance. \
//		    	/info - To get a wallets info. \
//		    	/send <address> <amount> - To get a wallets info. \

		
	});
};

const onRunGroup = (ctx,callback) =>{

    ctx.reply('Avaliable group commands \n\
	/tip @username amount - Send a tip to user. Make sure he has this bot connected to his personally account. \n\
    	');

	//callback(false);
};


module.exports =  {
	enabled:true,
	run:function(ctx,callback){
		if(ctx.aRequest.is.user) {
			onRunUser(ctx, callback);
			return;
		}

		onRunGroup(ctx,callback);
		
		// if(ctx.aRequest.is.group) {
		// 	return onRunGroup(ctx, callback);
		// }
	},
	// notify:function(data,callback) {
	// 	callback(true);
	// }
};
