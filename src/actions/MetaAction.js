'use strict'
/**
 * A Telegram Command. Address basically returns wallet*s) address.
 * To return current wallets address do /address 
 * 
 * @module Commands/address
 */
const Action = require('../base/action');

class MetaAction extends Action {

	get name() {
        return "meta";
    }
	auth(ctx) {
		return !ctx.appRequest.is.group;
	}
	async run(ctx) {
		if(ctx.test)  return;
		const Meta = this.loadModel('Meta');

		const metas = await Meta.getByUserId(ctx.from.id);
		if(!metas) return ctx.appResponse.reply("Invalid or expired meta id");
		const response = await Meta.relay(this.Coin, metas);
		return await ctx.appResponse.reply(response);
	}
}
module.exports = MetaAction;
