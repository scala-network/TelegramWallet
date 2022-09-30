'use strict';
const Model = require('./model');
const CoinManager = require('./coin_manager')();

class Prompt {
	get enabled () {
		return true;
	}

	get Coins () {
		return CoinManager;
	}

	get description () {
		return false;
	}

	get needStart(){
		return true;
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
		if(this.needStart) {
			const user = await this.loadModel('User').findById(ctx.from.id);
 			if(!user) return ctx.sendMessage('Seems you are not connected run /start to get connected');
		}
		if (!this.auth(ctx)) {
			const toId = (!ctx.appRequest.is.group) ? ctx.appRequest.from.id : ctx.chat.id;
			if (ctx.appRequest.is.action) { return await ctx.telegram.sendMessage(toId, `Authorization failed for \`${ctx.appRequest.action}\``); } else if (ctx.appRequest.is.command) { return await ctx.telegram.sendMessage(toId, `Authorization failed for \`${ctx.appRequest.command}\``); }
		}
		await this.run(ctx);
	}
}

module.exports = Prompt;
