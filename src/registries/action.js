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
		const exec = async ctx => {
			if (!ctx.appRequest || !ctx.appRequest.is.action) return;
			await reg.exec(ctx);
		};
		bot.action(reg.listenTo, exec);
	}
}

module.exports = bot => {
	const manager = new ActionManager();
	manager.setBot(bot);
};
