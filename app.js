/**
 * APP Script
 * Observer for telegram events
 * @module APP
 */

const cluster = require('cluster');
require("./src/bootstrap");

if(!cluster.isWorker) {
    const spawn = function(forkId) {
        const worker = cluster.fork({
            forkId
        });
        worker.forkId = forkId;
        worker.on('exit', function (code, signal) {
            setTimeout(function () {
               spawn({
                    forkId
               });
            }, 500);
        });
    }
    spawn(0);// For worker
    spawn(1);// For application
    return;
}
const logSystem = "app";
const TimeAgo = require('javascript-time-ago');
TimeAgo.addDefaultLocale(require('javascript-time-ago/locale/en'));
if(process.env.forkId === 0) {
    return require('./src/worker.js');
}

const Telegraf = require('telegraf');

const bot = new Telegraf.Telegraf(global.config.bot.token);
    // We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then(bot_informations => {
    // bot.options.username = bot_informations.username;
    global.config.bot.name = "@" + bot_informations.username;
    global.log('info', logSystem, "Server initialized");
    global.log('info', logSystem, "Bot Nick: %s", global.config.bot.name);
    global.log('info', logSystem, "Loading Registries");
    require('./src/registries/middleware')(bot);
    require('./src/registries/command')(bot);
});
bot.catch(e => global.log('error', logSystem, e));
bot.launch();

// // Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));     

