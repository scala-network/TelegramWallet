const Middleware = require('../base/middleware');
const logSystem = "middleware/request";

class RequestMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "request";
    }

    async run(ctx, next) {
         if(ctx.test)  return;

        if(!('message' in ctx) || !('text' in ctx.message)) {
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
        const isAnAction = action.startsWith("/") && global.CommandManager.getRegisters().indexOf(action.replace("/","") >= 0);
        const is = {
            admin : global.config.admins.indexOf(ctx.from.id) >= 0,
            group : is_group,
            user : !is_group && ctx.message.chat.type != "channel" || ctx.message.chat.type === 'private',
            action: isAnAction
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
        
        ctx.sendToAdmin = msg => {
            console.log("We have an error");
            console.log(appRequest);
            console.error(msg);
        };

        ctx.appRequest =  {is,action,query,args};
        if(next) {
            return next(ctx);    
        }
    };
}

module.exports = RequestMiddleware;


