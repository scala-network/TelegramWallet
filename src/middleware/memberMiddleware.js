const Middleware = require('../base/middleware');
const logSystem = "middleware/log";

class MemberMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "member";
    }

    static Chats = {}

    async run(ctx, next) {
        const findAllByChatId = chatId => {
            if (!MemberMiddleware.Chats[chatId]) {
                return []
            }
            return Object.keys(MemberMiddleware.Chats[chatId]).map(id => MemberMiddleware.Chats[chatId][id]);
        }   

        const existsInChatId = (chatId,userId) => {
            return new Promise((resolve, reject) => {
                const members = findAllByChatId(chatId);
                resolve(!!~members.indexOf(userId));
            });
        }   





        if (('chat' in ctx) && ('id' in ctx.chat)) {
            if(!(ctx.chat.id in MemberMiddleware.Chats)) {
                MemberMiddleware.Chats[ctx.chat.id] = {}
            }  

            if(!('members' in ctx)) {
                ctx.members = {
                    findAll:function() {
                        return findAllByChatId(ctx.chat.id);
                    }
                };
            }

            if (('from' in ctx) && ('id' in ctx.from)) {
                if(!('existsInChatId' in ctx.members)) {
                    ctx.members.existsByUserId = async id => {
                        return await existsInChatId(ctx.chat.id, id);
                    }
                }
            }
        } 

        if(next) {
            await next(ctx);    
        }

    };
}

module.exports = MemberMiddleware;


