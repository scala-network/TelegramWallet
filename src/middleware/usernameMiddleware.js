const Middleware = require('../base/middleware');
const logSystem = "middleware/log";

class UsernameMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "username";
    }

    async run(ctx, next) {
        if(ctx.test)  return;

        if(!ctx || !ctx.appRequest || !ctx.appRequest.is.action || !ctx.from.username){
            return next(ctx);
        }

        
        if(next) {
           await next(ctx);
        }
    }

}

module.exports = UsernameMiddleware;
