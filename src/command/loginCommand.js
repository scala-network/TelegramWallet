'use strict';
/**
* A Telegram Command. Address basically returns wallet*s) address.
* To return current wallets address do /address
*
* @module Commands/address
*/
const Command = require('../base/command');
const {Markup} = require('telegraf');

class LoginCommand extends Command {
	get name () {
		return 'login';
	}

	get description () {
		return 'Uses bot to login';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;
		const Auth = this.loadModel('Auth');
		const buttons = [];
		for(let field of Auth.fields) {
			buttons.push(Markup.button.login(field.title, field.auth, {
				bot_username: global.config.bot.username,
				request_write_access: true,
			}));
		}
		const keyboard = Markup.inlineKeyboard(buttons);
		return await ctx.reply("Choose a system to be logged in", keyboard);
	}
}
module.exports = LoginCommand;
