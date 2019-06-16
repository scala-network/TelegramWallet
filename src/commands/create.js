const logSystem = "cmd/create";

const MaxWalletUser = 1;

module.exports = {
    getSummary:function() {
        return  "Create a new wallet. ";
    },
    getDescription:function() {
        return "Create a wallet for a user. Either sends a password for password protected wallet or empty for passwordless wallet.\n\
command usage /create or /create <password>.";
    },
    enabled:true,
    run: (ctx,callback) => {


        if(ctx.aRequest.is.group && !ctx.aRequest.is.admin) {
            ctx.reply('Currently unavaliable and only for admins');
            return;
        }

        const wkey = [global.config.redis.prefix, "Wallets" ,ctx.from.id].join(':');
        const uKey = [global.config.redis.prefix, "Users" ,ctx.from.id].join(':');
        const cmds = [['hmget',uKey,['username','request']],['llen', wkey]];

        global.redisClient.multi(cmds).exec((error, results) => {

            if(error) {
                callback(error);
                return;
            } 

            const walletCount = results[1]?results[1]:0;

            if(results[0][0] !== ctx.from.username) {
                global.redisClient.hmset(uKey,[
                        'request', 1,
                        'username',ctx.from.username,
                        'id',ctx.from.id
                    ],function(error) {
                        
                    if(error) {
                        callback(error);
                        return;
                    }

                    
                    if(walletCount >= MaxWalletUser) {
                        ctx.reply("Maximum wallet creation reached.");
                        callback(null); 
                        return;
                    }

                    Queue.push({
                            'from' : ctx.from,
                            'chat' : ctx.chat,
                            'message' : ctx.message,
                            'request': ctx.aRequest,
                    },function(e) {

                        if(e) {
                            ctx.reply('Request queued: create new wallet at ' + walletCount);
                            callback(error); 
                            return;
                        }

                    });

                }); 
            } else {

                if(results[0][1] == 1) {
                    ctx.reply("A request has already been made. Please wait.");
                    callback(null); 
                    return;
                }

                if(walletCount >= MaxWalletUser) {
                    ctx.reply("Maximum wallet creation have been reached.");
                    callback(null); 
                    return;
                }

                Queue.push({
                        'from' : ctx.from,
                        'chat' : ctx.chat,
                        'message' : ctx.message,
                        'request': ctx.aRequest,
                    },function(e) {

                    if(e) {
                        ctx.reply('Request queued: create new wallet at ' + walletCount);
                        callback(error); 
                        return;
                    }
                    
                });

            }
                    
        });

    }
	
};
