/**
 * APP Script
 * Observer for telegram events
 * @module APP
 */

const cluster = require('cluster');

if(!cluster.isWorker) {
    const spawn = function() {
        const worker = cluster.fork();
        worker.on('exit', function (code, signal) {
            setTimeout(function () {
               spawn();
            }, 500);
        });
    }
    return spawn();
}
require("./src/bootstrap");

const TimeAgo = require('javascript-time-ago');
TimeAgo.addDefaultLocale(require('javascript-time-ago/locale/en'));
const Telegraf = require('telegraf');
const logSystem = "app";
const bot = new Telegraf.Telegraf(global.config.bot.token);
try{
        // We can get bot nickname from bot informations. This is particularly useful for groups.
    bot.telegram.getMe().then(bot_informations => {
        bot.options.username = bot_informations.username;
        global.config.bot.name = "@" + bot_informations.username;
        global.log('info', logSystem, "Server initialized");
        global.log('info', logSystem, "Bot Nick: %s", global.config.bot.name);
        global.log('info', logSystem, "Loading Registries");
        require('./src/registries/middleware')(bot);
        require('./src/registries/command')(bot);
    });


    bot.launch()
} catch(e) {
    global.log('error', e.getMessage());
    global.log('error', e);
}


// // Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

                                                                                                                    