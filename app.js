const Telegraf = require('telegraf');
const path = require('path');
const fs = require('fs');
const {Extra, Markup} = Telegraf;   // Extract Extra, Markups from Telegraf module.

const configFile =  path.join(__dirname,'config.json');
const logSystem = 'app';

const redis = require('redis');
try {
    const rfs = fs.readFileSync(configFile);

    // require("jsonlint").parse(rfs);

	global.config = JSON.parse(rfs);

} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}

const redisConfig = {
	db: global.config.redis.hasOwnProperty('db') ? global.config.redis.db : 0,
	socket_keepalive:global.config.redis.hasOwnProperty('keepalive')?global.config.redis.keepalive:true,
	retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
        	log('error', logSystem,'The server refused the connection');
			return;
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },
    auth_pass:global.config.redis.hasOwnProperty('auth')?global.config.redis.auth:null
};
if(global.config.redis.hasOwnProperty('path')) {
	redisConfig.path = global.config.redis.path;	 
} else {
	redisConfig.address = global.config.redis.address;
	redisConfig.port = global.config.redis.port;
}

global.redisClient = redis.createClient(config);
	
redisClient.on('error', function (err) {
    log('error',logSystem, "Error on redis with code : %j",[err]);
});
require('./src/log');

const bot = new Telegraf(global.config.bot.token);

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: @"+bot_informations.username);
});

const cache = {};

const cmds = ['start','create'];

bot.use(async (ctx, next) => {

  const start = new Date()
  await next()
  const ms = new Date() - start
  global.log('info',logSystem, "Request : %s Args : %s [%sms]",[ctx.action, ctx. argument.split(' ').join(','), ms]);

});

for(let i =0; i< cmds.length;i++) {
	
	let c = cmds[i];
	
	let o;
	
	if(cache.hasOwnProperty(c)) {
		o = cache[c];
	} else {
		o = require('./src/Commands/' + c + '.js');
	}


	bot.command(c, ctx => {

        if(ctx.from.is_bot) {
            global.log('warning',logSystem, "Request from bot: %s",[ctx.from.username]);
            return;
        }

        if(global.config.admin.actions.indexOf(c) >= 0 && global.config.admin.users.indexOf(ctx.from.id) < 0) {
            global.log('warning',logSystem, "Request from non admin: %s for action %s",[ctx.from.username,c]);
            return;
        }

        const text = ctx.message.text;
        const args = text.split(' ');
        if(args.length > 1) {
            ctx.argument = ctx.message.text.replace('/' + c + " ",'');
            ctx.arguments = ctx.argument.split(' ');
        }
        ctx.action = c;
		o(ctx);
	});
}

const fetchRedisEvent = () => {
    const qKey = [global.config.redis.prefix,"Notify"].join(':');

    redisClient.lpop(qKey,(e,r) => {
        if(e || !r) {
            setTimeout(fetchRedisEvent,global.config.rpc.interval);
            return;
        }

        const data = JSON.parse(r);
        switch(data.ctx.action) {
            case 'open_wallet':
                break;
            case 'create_wallet':
                    let msg = "Your wallet has been created\n";
                    msg += " Address: "+ data.wallet.address +"\n";
                    msg += " Balance: "+ data.wallet.balance +"\n";
                    bot.telegram.sendMessage(data.ctx.from.id, msg)
                break;
        }

    });
};

bot.startPolling();