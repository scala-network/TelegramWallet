'use strict';
/**
 */
const Action = require('../base/action');

class MetaCancelAction extends Action {
	get name () {
		return 'meta_cancel';
	}

	get description () {
		return 'Meta cancel submission to relay transaction';
	}

	async run (ctx) {
		if (ctx.test) return;
		const Meta = this.loadModel('Meta');
		const x = await ctx.editMessageText('Processing Action');
		const metas = await Meta.getByUserId(ctx.appRequest.from.id);
		if (!metas) {
			await ctx.reply('Invalid or expired meta id');
		} else {
			Meta.deleteMeta(ctx.appRequest.from.id);
			const response = `Transaction Cancel`;
			await ctx.reply(response, {parse_mode: 'HTML'});			
		}

		await ctx.telegram.deleteMessage(ctx.from.id,x.message_id);
	}
}
module.exports = MetaCancelAction;
