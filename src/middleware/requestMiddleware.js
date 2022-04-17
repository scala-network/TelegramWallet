'use strict';
const Middleware = require('../base/middleware');
const logSystem = 'middleware/request';

class RequestMiddleware extends Middleware {
	enabled = true;

	get name () {
		return 'request';
	}

	async run (ctx, next) {
		if (ctx.test) return;

		if (!ctx || !ctx.message || !ctx.message.text) {
			if (next) {
				await next(ctx);
			}
			return;
		}

		const cmd1 = ctx.message.text.split(' ')[0];

		let action = cmd1;

		if (action.endsWith(global.config.bot.name)) {
			action = action.replace(global.config.bot.name, '').trim();
		}
		const isGroup = ctx.message.chat.type === 'group' || ctx.message.chat.type === 'supergroup';
		const isAnAction = action.startsWith('/') && global.config.commands.allowed.indexOf(action.replace('/', '')) >= 0;
		const is = {
			admin: global.config.admins.indexOf(ctx.from.id) >= 0,
			group: isGroup,
			user: !isGroup && (ctx.message.chat.type !== 'channel' || ctx.message.chat.type === 'private'),
			action: isAnAction,
			bot: ctx.message.from.is_bot
		};
		let args = [];
		let query = null;

		if (isAnAction) {
			const _query = ctx.message.text.replace(`${cmd1}`, '').trim();

			if (_query !== '') {
				args = _query.split(' ');
				query = _query;
			}
			// action = action.replace()
		} else {
			action = null;
		}
		// if(isAnAction && is_group && data.status == "administrator") {
		//	 setTimeout(() => ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message_id), 1000);
		// }

		// const snm = ctx.telegram.sendMessage;

		// ctx.telegram.sendMessage  = async function(a,b,c,d) {
		//	 return await snm(a,b,c,d).catch(e => global.log('error', logSystem, e));
		// }

		// ctx.reply  = async function(a,b,c,d) {
		//	 return await snm(is.group ? ctx.message.chat.id : ctx.message.from.id,a,b,c,d).catch(e => global.log('error', logSystem, e));
		// }

		ctx.appRequest = { is, action, query, args };
		ctx.appResponse = {
			sendMessage: async function (a, b, c, d) {
				c = Object.assign({
					parse_mode: 'HTML'
				}, c);
				return await ctx.telegram.sendMessage(a, b, c, d).catch(function (e) {
					global.log('error', logSystem, 'Error sending to id : ' + a);
					global.log('error', logSystem, e);
				});
			},
			reply: async function (a, b, c, d) {
				b = Object.assign({
					parse_mode: 'HTML'
				}, b);
				return await ctx.reply(a, b, c, d).catch(function (e) {
					global.log('error', logSystem, 'Error sending to id : ' + is.group ? ctx.message.chat.id : ctx.message.from.id);
					global.log('error', logSystem, e);
				});
			},
			sendToAdmin: msg => {
				console.log('We have an error');
				console.log(ctx.appRequest);
				console.error(msg);
			}
		};

		if (next) {
			return next(ctx);
		}
	}
}

module.exports = RequestMiddleware;
