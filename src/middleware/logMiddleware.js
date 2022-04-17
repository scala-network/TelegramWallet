const Middleware = require('../base/middleware');
const logSystem = 'middleware/log';

class LogMiddleware extends Middleware {
	enabled = true;

	get name () {
		return 'log';
	}

	async run (ctx, next) {
		if (ctx.test) return;

		if (!ctx || !ctx.appRequest || (!ctx.appRequest.is.action && !ctx.appRequest.is.command) || !ctx.from.username) {
			return next(ctx);
		}

		const start = new Date();
		if (next) {
			await next(ctx);
		}
		const ms = new Date() - start;
		const chatID = ('chat' in ctx) && ('id' in ctx.chat) ? ctx.chat.id : 'private';
		if (ctx.appRequest.is.command) {
			const msg = (ctx.update && ctx.update.message) ? ctx.update.message.text : (('message' in ctx) ? ctx.message.text : '');
			global.log('info', logSystem, 'Command: %s From: %s Request : %s [%sms]', [
				chatID,
				ctx.from.username,
				msg,
				ms
			]);
		} else if (ctx.appRequest.is.action) {
			const action = (ctx.update && ctx.update.callback_query) ? ctx.update.callback_query.data : '';
			global.log('info', logSystem, 'Action: %s From: %s Request : %s [%sms]', [
				chatID,
				ctx.from.username,
				action,
				ms
			]);
		}
	}
}

module.exports = LogMiddleware;
