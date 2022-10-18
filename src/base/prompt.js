'use strict';
const Model = require('./model');
const CoinManager = require('./coin_manager')();
const Helper = require('../helpers/index');
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

	get needStart () {
		return true;
	}

	loadModel (modelName) {
		return Model.LoadRegistry(modelName);
	}

	get Helper () {
		return Helper;
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
		if (!ctx) return;
		const toId = ctx.appRequest.from.id;

		if (this.needStart) {
			const user = await this.loadModel('User').findById(ctx.appRequest.from.id);
			if (!user) return await ctx.telegram.sendMessage(toId, 'Seems you are not connected run /start to get connected').catch(e => {});
			if ('error' in user) return await ctx.telegram.sendMessage(toId, user.error).catch(e => {});
		}
		if (!this.auth(ctx)) {
			let command;
			const loc = (!ctx.appRequest.is.group) ? 'here must be in group' : 'in group';
			if (ctx.appRequest.is.action) {
				command = ctx.appRequest.action;
			} else if (ctx.appRequest.is.command) {
				command = ctx.appRequest.command;
			}
			return await ctx.telegram.sendMessage(toId, `Not allowed to run \`${command}\` ${loc}`).catch(e => {

			});
		}
		await this.run(ctx);
	}
}

module.exports = Prompt;
