'use strict';

const Registeries = require('../base/registries');

class Middleware extends Registeries {
	get allowed () {
		return [
			'request',
			'log',
			'member'
			// "markdownMiddleware"
		];
	}

	get registerName () {
		return 'Middleware';
	}

	setBotRegistry (reg, bot) {
		bot.use(async (ctx, next) => {
			await reg.run(ctx, next);
		});
	}
}

module.exports = bot => {
	const man = new Middleware();
	man.setBot(bot);
};
