'use strict';
const Middleware = require('../base/middleware');
const logSystem = 'middleware/request';
let warmingUp = true;

setTimeout(() => {
	warmingUp = false;
	global.log('info', logSystem, 'Warming Up completed');
}, 60*1000);

class RequestMiddleware extends Middleware {
	enabled = true;

	get name () {
		return 'request';
	}

	async run (ctx, next) {
		if (ctx.test) return;
		
		if (!ctx || !ctx.update || warmingUp) {
			if (next) {
				await next(ctx);
			}
			return;
		}
		const appRequest = {
			is: {
				action: false,
				command: false,
				admin: false,
				group: false,
				user: false,
				bot: false
			},
			args: [],
			query: null,
			command: null,
			action: null,
			from: {}
		};

		if ('message' in ctx.update && ctx.update.message.text) {
			const message = ctx.update.message;
			let command = message.text.split(' ')[0];
			if (command.endsWith(global.config.bot.name)) {
				command = command.replace(global.config.bot.name, '').trim();
			}
			const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup';
			const isUser = !isGroup && (message.chat.type !== 'channel' || message.chat.type === 'private');
			const isCommand = command.startsWith('/') && global.config.commands.allowed.indexOf(command.replace('/', '')) >= 0;

			appRequest.is.action = false;
			appRequest.is.command = isCommand;
			appRequest.is.group = isGroup;
			appRequest.is.user = isUser;
			let args = [];
			let query = null;

			if (isCommand) {
				const _query = message.text.replace(`${command}`, '').trim();

				if (_query !== '') {
					args = _query.split(' ');
					query = _query;
				}
			} else {
				command = null;
			}
			appRequest.command = command;
			appRequest.args = args;
			appRequest.query = query;
			appRequest.from = message.from;
		} else if ('callback_query' in ctx.update) {
			const cb = ctx.update.callback_query;
			appRequest.is.action = true;
			appRequest.is.command = false;
			appRequest.action = cb.data;
			appRequest.from = cb.from;
		} else {
			if (next) {
				await next(ctx);
			}
			return;
		}
		appRequest.is.bot = appRequest.from.is_bot;

		ctx.appRequest = appRequest;
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
					global.log('error', logSystem, 'Error sending to id : ' + appRequest.is.group ? ctx.update.message.chat.id : appRequest.from.id);
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
