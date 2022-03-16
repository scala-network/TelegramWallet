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
      
        if (!ctx || !ctx.appRequest || !ctx.appRequest.is.group || ctx.appRequest.is.action) {
            if (next) {
                return next();
            }
            return;
        }
        const User = Model.LoadRegistry("User");
        const userId = ctx.from.id;
        if (!await User.exists(userId)){
            
            if (next) {
                return next();
            }
            return;
        }
        const username = await User.getUsernameById(userId);
        if(username !== ctx.from.username) {
            await User.updateUsername(userId, ctx.from.username);
        }
        
        await Model.LoadRegistry("Member").addMember(ctx.chat.id, userId);
        // global.log("info",logSystem,"Chat id %d updated for member id %d" , [ctx.chat.id, ctx.from.id]);
        if (next) {
            return next();
        }

    };
}

module.exports = MemberMiddleware;


