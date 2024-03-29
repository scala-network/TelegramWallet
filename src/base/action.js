'use strict';
const Prompt = require('./prompt');

class Action extends Prompt {
	static NO_ARGUMENTS = 0;
	static ALPHA_ARGUMENTS = 1;
	static NUMERIC_ARGUMENTS = 2;
	static ALPHANUMERIC_ARGUMENTS = 3;
	get haveArguments () {
		return Action.NO_ARGUMENTS;
	}

	get listenTo () {
		switch (this.haveArguments) {
		case Action.ALPHA_ARGUMENTS:
			return new RegExp(`^${this.name}-([A-Za-z]+)$`);
		case Action.ALPHANUMERIC_ARGUMENTS:
			return new RegExp(`^${this.name}-([a-zA-Z0-9]+)$`);
		case Action.NUMERIC_ARGUMENTS:
			return new RegExp(`^${this.name}-(\\d+)$`);
		case Action.NO_ARGUMENTS:
		default:
			return this.name;
		}
	}

	async exec (ctx) {
		await ctx.answerCbQuery();
		await super.exec(ctx);
	}
}

module.exports = Action;
