'use strict';
/**
 * A Telegram Command. Display rank on most rain maker
 *
 * @module Commands/address
 */
const Command = require('../base/command');

class NimbusCommand extends Command {
	get name () {
		return 'nimbus';
	}

	get description () {
		return 'Who makes the most rain';
	}
	
	get needStart() {
		return false;
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

		let results = await Member.findNimbus(ctx.chat.id,coin);
		const coinObject = this.Coins.get(coin);
		if (results.overall.length <= 0) {
			return ctx.appResponse.reply(`It haven't been raining for ${coin}`);
		}

		let template = `<u>Nimbus Rain Today ${coin}</u>`;

		for (let i = 0; i < results.today.length; i++) {
			const member = results.today[i];
			template += '\n' + member.username + '    ' + coinObject.format(member.amount);
		}

		template += `\n\n\n<u>Nimbus Rain All Time ${coin}</u>`;

		for (let i = 0; i < results.overall.length; i++) {
			const member = results.overall[i];
			template += '\n' + member.username + '    ' + coinObject.format(member.amount);
		}
		
		await ctx.appResponse.sendMessage(ctx.chat.id, template);
	}
}
module.exports = NimbusCommand;
