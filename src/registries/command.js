const logSystem = 'registry/command';
const Registeries = require('../base/registries');
const Model = require('../base/model');

class CommandManager extends Registeries {

	get registerName() {
		return "Command";
	}
	
	get allowed() {
		return global.config.commands.allowed;
	}

	setBotRegistry(reg, bot) {	
		const exec = async ctx => {
			if(!ctx.from.username) {
				ctx.reply("Unable to process request for users without username");
				return;
			}

			if(!ctx.from.id) {
				ctx.reply("Unable to process request for users without id");
				return;
			}

			if(!ctx.appRequest || !ctx.appRequest.is.action) {
				return;
			}
			const User = Model.LoadRegistry('User');
			const exists = await User.exists(ctx.from.id);
			if(ctx.appRequest.is.group && !exists) {
				ctx.telegram.sendMessage(ctx.message.chat.id,"Please create a wallet https://t.me/" + global.config.bot.username);
				return;
			}
			reg.exec(ctx);
		};
		bot.command(reg.name, exec);
		bot.command(reg.name + '@' + global.config.bot.username, exec);
	}
}


module.exports = bot => {
	if(!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
}