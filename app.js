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
const command = require('./src/registry/command');

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
  const aRequest = ctx.aRequest;
  global.log('info',logSystem, "From: %s Request : %s Args : %s [%sms]",[
     ctx.from.username, 
     aRequest.action, 
     aRequest.query.passes.join(','),
     ms
     ]);

});

command.map(function(error, cmd, mappedRunCommand){
    if(error) {
        global.log('warning',logSystem, "Request from bot: %s error: %j",[cmd,error]);
        return;
    };
    bot.command(cmd, ctx => {

        if(ctx.from.is_bot) {
            global.log('warning',logSystem, "Request from bot: %s",[ctx.from.username]);
            return;
        }

        
        const text = ctx.message.text;
        const args = text.split(' ');

        let pass;
        let passes;
        if(args.length > 1) {
            pass = ctx.message.text.replace('/' + c + " ",'');
            passes = ctx.argument.split(' ');
        } else {
            pass = '';
            passes = [];
        }

        const is_group = ctx.message.chat.type == "group" ||  ctx.message.chat.type == "supergroup";
        ctx.aRequest = {
            is: {
                admin : global.config.admins.indexOf(ctx.from.id) >= 0,
                group : is_group,
                user : !is_group && ctx.message.chat.type != "channel"
            },
            action: cmd,
            query : {
                pass:pass,
                passes:passes
            }
        };
        mappedRunCommand(ctx,function(error) {
            if(error) {
                log('error', logSystem,'No wallet for user %s id: %s', [ctx.from.username,ctx.from.id]);
            }   
        });
    });
})

const notification = function(callback){
    async.forever(function(next) {
        const moveon = function() {
           setTimeout(next,global.config.rpc.interval);
       };

       Queue.sub(function(error,context){
            if(error || !response) {
                moveon();
                return;
            }

            command.notify(context.request.action, data,function(error,id,message){
                if(error) {
                    if(typeof error == 'string') {
                        log('error',logSystem, "Error : %s", [error]);
                    } else {
                       log('error',logSystem, "Error : %j", [error]);
                    } 
                    moveon();
                    return;
                }
                if(error === false) {
                    moveon();
                    return;
                }
                bot.telegram.sendMessage(id,message);
                moveon();
            });
        });
    },function(e){
        console.log(e);
    });

}
const Tasks = [notification, function(callback){
    async.forever(function(next) {
        try{
            bot.startPolling();
        } catch(e) {
            next();
        }
    });
}];
async.parallel(async.reflectAll(Tasks));


