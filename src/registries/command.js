const logSystem = 'registry/command';
const Registeries = require('../base/registries');
const Model = require('../base/model');

class CommandManager extends Registeries {
	get registerName () {
		return 'Command';
	}

	get allowed () {
		return global.config.commands.allowed;
	}

	setBotRegistry (reg, bot) {
		const exec = async ctx => {
			if (!ctx.from.username || !ctx.from.username.trim()) {
				ctx.reply('Unable to process request for users without username').catch(e => {});
				global.log('warn', logSystem, 'No username defined for ID : ' + ctx.from.id);
				return;
			}

			if (!ctx.from.id) {
				ctx.reply('Unable to process request for users without id');
				global.log('warn', logSystem, 'No ID defined for username : ' + ctx.from.username);
				return;
			}

			if (!ctx.appRequest || !ctx.appRequest.is.command) return;
			const User = Model.LoadRegistry('User');
			const exists = await User.exists(ctx.from.id);
			if (ctx.appRequest.is.group && !exists) {
				ctx.telegram.sendMessage(ctx.message.chat.id, 'Please create a wallet https://t.me/' + global.config.bot.username);
				return;
			}
			reg.exec(ctx).then(() => {
				if(ctx.appRequest.is.group) {
					// Delete any message in any chat groups only
					ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id).catch(e => {});
				}
			});
		};
		bot.command(reg.name, exec);
		bot.command(reg.name + '@' + global.config.bot.username, exec);
	}
}

module.exports = bot => {
	if (!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
};
