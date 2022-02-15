const Middleware = require('../base/middleware');
const logSystem = "middleware/request";

class RequestMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "request";
    }


    async run(ctx, next) {
        if(!('message' in ctx) || !('text' in ctx.message)) {
            if(next) {
                await next(ctx);    
            }
            return;
        }

        let cmd1 = ctx.message.text.split(" ")[0];
        let cmd = cmd1;
        if(!cmd.startsWith("/")) {
            if(next) {
                await next(ctx);    
            }
            return;
        }

        if(cmd.endsWith(global.config.bot.name)) {
            cmd = cmd.replace(global.config.bot.name,'').trim();
        }

        let query = ctx.message.text.replace(`${cmd1}`,'').trim();
        
        let args = [];
        if(query !== "") {
            args = query.split(' ');
        } else {
            query = null;
        }

        ctx.sendToAdmin = msg => {
            console.log("We have an error");
            console.log(appRequest);
            console.error(msg);
        };

        const is_group = ctx.message.chat.type == "group" ||  ctx.message.chat.type == "supergroup";

        const appRequest = {
            is: {
                admin : global.config.admins.indexOf(ctx.from.id) >= 0,
                group : is_group,
                user : !is_group && ctx.message.chat.type != "channel" || ctx.message.chat.type === 'private'
            },
            action: cmd,
            query : query,
            args : args
        };

        ctx.appRequest = appRequest;
        
        if(next) {
            await next(ctx);    
        }
    };
}

module.exports = RequestMiddleware;


