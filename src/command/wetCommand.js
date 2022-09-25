'use strict';
/**
 * A Telegram Command. Display rank on most earn by rain
 *
 * @module Commands/address
 */
const Command = require('../base/command');

class WetCommand extends Command {
	get name () {
		return 'wet';
	}

	get description () {
		return 'Who gets the most rain';
	}

	auth (ctx) {
		return ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;
		const Member = this.loadModel('Member');

		let coin;
		if (ctx.appRequest.args.length >= 1) {
			coin = (''+ctx.appRequest.args[0]).trim().toLowerCase();
		}
		if(!coin) {
			coin = 'xla';
		}
		if(!~global.config.coins.indexOf(coin)) {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}

		const coinObject = this.Coins.get(coin);

		const results = await Member.findWet(ctx.chat.id, coin);

		if (results.overall.length <= 0) {
			return ctx.appResponse.reply("It haven't been raining");
		}

		let template = `<u>Wettest Today ${coin}</u>`;

		for (let i = 0; i < results.today.length; i++) {
			const member = results.today[i];
			template += '\n' + member.username + '    ' + coinObject.format(member.amount);
		}

		template += `\n\n\n<u>Wettest All Time ${coin}</u>`;


		for (let i = 0; i < results.overall.length; i++) {
			const member = results.overall[i];
			template += '\n' + member.username + '    ' + coinObject.format(member.amount);
		}

		await ctx.appResponse.sendMessage(ctx.chat.id, template, { parse_mode: 'HTML' });

	}
}
module.exports = WetCommand;
