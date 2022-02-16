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
		bot.command(reg.name, async ctx => {

			if(!ctx.appRequest || !ctx.appRequest.is.action || !ctx.from.username || !ctx.from.id) {
				return;
			}
			const User = Model.LoadRegistry('User');
			const exists = await User.exists(ctx.from.id);
			if(ctx.appRequest.is.group && !exists) {
				ctx.reply("Please create a wallet https://t.me/scalawalletbot");
				return;
			}
			reg.exec(ctx);
		});
		bot.command(reg.name + global.config.bot.name, ctx => reg.exec(ctx));
	}
}


module.exports = bot => {
	if(!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
}