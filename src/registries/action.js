const logSystem = 'registry/action';

class ActionManager {
	get registerName() {
		return "Action";
	}

}


module.exports = bot => {
	if(!global.ActionManager) {
		global.ActionManager = new ActionManager();
	}
	global.ActionManager.setBot(bot);
}