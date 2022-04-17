const logSystem = 'base/Prompt';

'use strict';
const Model = require('./model');
const Coin = require('./coin');

class Prompt {
	get enabled () {
		return true;
	}

	get Coin () {
		return Coin();
	}

	get description () {
		return false;
	}

	loadModel (modelName) {
		return Model.LoadRegistry(modelName);
	}

	constructor () {
		if (!this.name || !this.description) {
			console.error('Method missing name @ description');
			process.exit();
		}

		try {
			this.run({ test: true });
		} catch (e) {
			console.error('Method missing run');
			process.exit();
		}
	}

	auth (ctx) {
		return true;
	}

	async exec (ctx) {
		if (!this.auth(ctx)) {
			const toId = (!ctx.appRequest.is.group) ? ctx.from.id : ctx.chat.id;
			return await ctx.telegram.sendMessage(toId, `Authorization failed for \`${ctx.appRequest.action}\``);
		}
		await this.run(ctx);
	}
}

module.exports = Prompt;
