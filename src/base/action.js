const logSystem = 'base/Action';

const Prompt = require('./prompt');

class Action extends Prompt{
	get listenTo() {
		return "";
	}

	async exec(ctx) {
		if(!this.auth(ctx)) {
			const toId = (!ctx.appRequest.is.group) ? ctx.from.id : ctx.chat.id;
			return await ctx.telegram.sendMessage(toId, `Authorization failed for \`${ctx.appRequest.action}\``);
		}
		await ctx.answerCbQuery();
		await this.run(ctx);
	}
}

module.exports = Action;