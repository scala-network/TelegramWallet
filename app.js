/**
 * APP Script
 * Observer for telegram events
 * @module APP
 */

require("./src/bootstrap");

const TimeAgo = require('javascript-time-ago');
TimeAgo.addDefaultLocale(require('javascript-time-ago/locale/en'));
const Telegraf = require('telegraf');
const logSystem = "app";
const bot = new Telegraf.Telegraf(global.config.bot.token);

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    global.log('info',logSystem,"Server has initialized bot nickname. Nick: @"+bot_informations.username);
    global.config.bot.name = "@"+bot_informations.username;
});


bot.use(async (ctx, next) => {

    const start = new Date()
    await next()
    const ms = new Date() - start;
    let msg = ('update' in ctx) ? ctx.update.message.text : (('message' in ctx) ? ctx.message.text : "");
    global.log('info',logSystem, "From: %s Request : %s [%sms]",[
        ctx.from.username, 
        msg,
        ms
    ]);
});

require('./src/registries/command')(bot);

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
