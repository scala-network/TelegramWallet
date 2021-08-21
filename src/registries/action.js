const logSystem = 'registry/action';

class ActionManager {
	get registerName() {
		return "Action";
	}


	
	setCommandContext(cmd, ctx) {
		const c = this.getRegister(cmd);

		if(!c || !c.enabled || ctx.from.is_bot) return;
		

		bot.action(cmd, ctx => {
		    

		})

	}
}


module.exports = bot => {
	if(!global.ActionManager) {
		global.ActionManager = new ActionManager();
	}
	global.ActionManager.setBot(bot);
}