const logSystem = 'registry/command';
const Registeries = require('../base/registries');

class CommandManager extends Registeries {

	get registerName() {
		return "Command";
	}
	
	get allowed() {
		return global.config.commands.allowed;
	}

	setBotRegistry(reg, bot) {	
		bot.command(reg.name, ctx => reg.exec(ctx));
		bot.command(reg.name + global.config.bot.name, ctx => reg.exec(ctx));
	}
}


module.exports = bot => {
	if(!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
}