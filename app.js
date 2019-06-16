/**
 * APP Script
 * Observer for telegram events
 * @module APP
 */
 const async = require('async');
 const path = require('path');
 const fs = require('fs');

 const configFile =  path.join(__dirname,'config.json');
 const logSystem = 'app';

 try {
    const rfs = fs.readFileSync(configFile);
    global.config = JSON.parse(rfs);

} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}

require('./src/log');
require('./src/interfaces/redis');
const Queue = require('./src/handlers/queue');
const command = require('./src/registries/command');

const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;   // Extract Extra, Markups from Telegraf module.

const bot = new Telegraf(global.config.bot.token);

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: @"+bot_informations.username);
});


bot.use(async (ctx, next) => {

    const start = new Date()
    await next()
    const ms = new Date() - start

    global.log('info',logSystem, "From: %s Request : %s [%sms]",[
        ctx.from.username, 
        ctx.message.text,
        ms
    ]);

});


bot.command('help', command.getDescriptions);
bot.command('start', command.getSummaries);

command.map(function(error, cmd, commandos){
    if(error) {
        global.log('warning',logSystem, "Request from bot: %s error: %j",[cmd,error]);
        return;
    };

    bot.command(cmd, ctx => {

        if(ctx.from.is_bot) {
            global.log('warning',logSystem, "Request bot: %s action: %s",[ctx.from.username]);
            return;
        }

        ctx = command.bindRequest(cmd, ctx);

        const passLength = ctx.aRequest.query.passes.length;

        if(!commandos.hasOwnProperty('passLength')){
            commandos.passLength = passLength;
        }

        if(passLength  !== commandos.passLength) {
            ctx.reply("Invalid argument for " + cmd + ". Requires " + commandos.passLength + " argument(s).\n\
             For more information go to /help " + cmd);
            return;
        }

        commandos.run(ctx,function(error) {
            if(error) {
                log('error', logSystem,'Error cmd: %s id: %s', [cmd,ctx.from.username]);
            }
        });
    });
});

const Tasks = [
    function(callback){
    
        async.forever(function(next) {
           Queue.sub(function(error,context){
                switch(true){
                    case error:
                        log('error',logSystem, "Error : %s", [error]);
                        break;
                    case !context:
                        break;
                    case !context.response.id || !context.response.message:
                        log('error',logSystem, "Error : %s \n %j", ['Empty response recieved',context]);
                        break;
                    default:
                        bot.telegram.sendMessage(context.response.id,context.response.message);
                        break;
                }
                setTimeout(next,global.config.rpc.interval);
            });
        });

}, function(callback){
    async.forever(function(next) {
        try{
            bot.startPolling();
        } catch(e) {
            next();
        }
    });
}];
async.parallel(async.reflectAll(Tasks));