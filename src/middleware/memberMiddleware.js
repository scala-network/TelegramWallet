const Middleware = require('../base/middleware');
const Model = require('../base/model');

const logSystem = "middleware/member";

class MemberMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "member";
    }

    async run(ctx, next) {
        if ('chat' in ctx) {

            const Member = Model.LoadRegistry("Member");

            if (await Member.existInChatId(ctx.chat.id, ctx.from.id)) {
                await Member.updateInChatId(ctx.chat.id, ctx.from.id);
            }
        }

        if (next) {
            await next(ctx);
        }

    };
}

module.exports = MemberMiddleware;


