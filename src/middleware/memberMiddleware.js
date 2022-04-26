'use strict';
const Middleware = require('../base/middleware');
const Model = require('../base/model');

class MemberMiddleware extends Middleware {
	enabled = true;

	get name () {
		return 'member';
	}

	async run (ctx, next) {
		if (ctx.test) return;

		if (!ctx || !ctx.appRequest || ctx.appRequest.is.command || ctx.appRequest.is.action) {
			if (next) next();
			return;
		}

		const User = Model.LoadRegistry('User');
		const userId = ctx.appRequest.from.id;
		const username = ctx.appRequest.from.username.trim();
		if(!username) {
			if (next) {
				return next();
			}
		}
		if (await User.exists(userId)) {
			const username = await User.getUsernameById(userId);
			if (username !== ctx.appRequest.from.username) {
				await User.updateUsername(userId, ctx.appRequest.from.username);
			}
			if (ctx.appRequest.is.group) {
				await Model.LoadRegistry('Member').addMember(ctx.chat.id, userId);
			}
		}

		if (next) {
			return next();
		}
	}
}
module.exports = MemberMiddleware;
