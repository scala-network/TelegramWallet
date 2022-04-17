'use strict';
const Prompt = require('./prompt');

class Action extends Prompt {
	get listenTo () {
		return this.name;
	}

	async exec (ctx) {
		await ctx.answerCbQuery();
		await super.exec(ctx);
	}
}

module.exports = Action;
