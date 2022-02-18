const Middleware = require('../base/middleware');
const logSystem = "middleware/request";

class RequestMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "request";
    }

    async run(ctx, next) {
         if(ctx.test)  return;

        if(!ctx || !ctx.message || !ctx.message.text) {
            if(next) {
                await next(ctx);    
            }
            return;
        }

        let cmd1 = ctx.message.text.split(" ")[0];
        
       
        let action = cmd1;

        if(action.endsWith(global.config.bot.name)) {
            action = action.replace(global.config.bot.name,'').trim();
        }

        const is_group = ctx.message.chat.type == "group" ||  ctx.message.chat.type == "supergroup";
        const isAnAction = action.startsWith("/");
        const is = {
            admin : global.config.admins.indexOf(ctx.from.id) >= 0,
            group : is_group,
            user : !is_group && ctx.message.chat.type != "channel" || ctx.message.chat.type === 'private',
            action: isAnAction,
            bot: ctx.message.from.is_bot
        };
        let args = [];
        let query = null;

        if(isAnAction) {
            let _query = ctx.message.text.replace(`${cmd1}`,'').trim();

            if(_query !== "") {
                args = _query.split(' ');
                query = _query;
            }
        } else {
            action = null;
        }
        // if(isAnAction && is_group && data.status == "administrator") {
        //     setTimeout(() => ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id), 1000);
        // }
        ctx.sendToAdmin = msg => {
            console.log("We have an error");
            console.log(appRequest);
            console.error(msg);
        };

        ctx.appRequest =  {is,action,query,args};
        // ctx.reply = function(message) {
        //     return ctx.telegram.sendMessage(ctx.from.id, message
        //         .replaceAll(".","\\.")
        //         .replaceAll("]","\\]")
        //         , { parse_mode: 'MarkdownV2' });
        // }
        if(next) {
            return next(ctx);    
        }
    };
}

module.exports = RequestMiddleware;


