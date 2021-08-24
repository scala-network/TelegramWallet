const Middleware = require('../base/middleware');
const logSystem = "middleware/log";

class LogMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "log";
    }

    async run(ctx, next) {
        if(ctx.test)  return;
        
        if('update' in ctx && 'my_chat_member' in ctx.update ){
            if('chat' in ctx.update.my_chat_member) {

                
            }
            return next();
        }


        const start = new Date()
        await next(ctx);
        const ms = new Date() - start;

        let msg = (ctx.update && ctx.update.message) ? ctx.update.message.text : (('message' in ctx) ? ctx.message.text : "");
        global.log('info',logSystem, "From: %s Request : %s [%sms]",[
            ctx.from.username, 
            msg,
            ms
        ]);
    }

}

module.exports = LogMiddleware;
