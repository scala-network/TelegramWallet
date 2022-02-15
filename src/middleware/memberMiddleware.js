const Middleware = require('../base/middleware');
const Model = require('../base/model');

const logSystem = "middleware/member";

class MemberMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "member";
    }

    async run(ctx, next) {
        if(ctx.test) return;
      
        

        if (!ctx.appRequest.is.group || ctx.appRequest.is.action) {
            if (next) {
                return next();
            }
        }
        
        if (!await Model.LoadRegistry("User").exists(ctx.from.id)){
            if (next) {
                return next();
            }
        }
        await Model.LoadRegistry("Member").addMember(ctx.chat.id, ctx.from.id);
        global.log("info",logSystem,"Char id %d updated for member id %d" , [ctx.chat.id, ctx.from.id]);
        if (next) {
            return next();
        }

    };
}

module.exports = MemberMiddleware;


