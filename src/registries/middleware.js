

const logSystem = 'registry/command';
const Registeries = require('./registries');

class MiddlewareManager extends Registeries {
    get allowed() {
        return [
            "request",
            "log",
            "member"
        ];
    }

    get registerName() {
        return "Middleware";
    }

    setBotRegistry(reg, bot) {
        bot.use(async (ctx, next) => {
            await reg.run(ctx, next)
        });
    }
}


module.exports = bot => {
    const man = new MiddlewareManager();
    man.setBot(bot);
}