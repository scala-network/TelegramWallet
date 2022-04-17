'use strict';
/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');

class SubmitCommand extends Command {
	get name () {
		return 'submit';
	}

	get description () {
		return 'Submit confirms sending coin by keying key generated from transfer command (usage /submit trx_key)';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;
		const Meta = this.loadModel('Meta');

		if (ctx.appRequest.args.length <= 0) {
			return ctx.appResponse.reply(`Missing argument for trx key\n${this.description}`);
		}

		const metas = await Meta.findById(ctx.from.id, ctx.appRequest.args[0]);

		if (!metas) return ctx.appResponse.reply('Invalid or expired meta id');
		const response = await Meta.relay(ctx.from.id, this.Coin, metas);
		return await ctx.appResponse.reply(response);
	}
}
module.exports = SubmitCommand;
