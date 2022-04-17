'use strict';

const Registeries = require('../base/registries');

class ActionManager extends Registeries {
	get registerName () {
		return 'Action';
	}

	get allowed () {
		return ['Meta'];
	}

	setBotRegistry (reg, bot) {
		bot.action(reg.listenTo, reg.exec);
	}
}

module.exports = bot => {
	if (!global.ActionManager) {
		global.ActionManager = new ActionManager();
	}
	global.ActionManager.setBot(bot);
};
