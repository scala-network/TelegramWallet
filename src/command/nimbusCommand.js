'use strict'
/**
 * A Telegram Command. Display rank on most rain maker 
 * 
 * @module Commands/address
 */
const Command = require('../base/command');

class NimbusCommand extends Command {
	enabled = true;

	get name() {
        return "nimbus";
    }
	
	get description() {
		return "Who makes the most rain";
	}

	auth(ctx) {
		return ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		const Member = this.loadModel('Member');
		const results = await Member.findNimbus(ctx.chat.id);

		if(results.overall.length <= 0) {
			return ctx.appResponse.reply("It haven't been raining");
		}

		let template = `** Nimbus Rain Today **`;

		for(let i =0;i< results.today.length;i++) {
			const member = results.today[i];
			template+="\n" + member.username + "    " + this.Coin.format(member.amount);
		}

		template += `\n\n\n** Nimbus Rain All Time **`;

		for(let i =0;i< results.overall.length;i++) {
			const member = results.overall[i];
			template+="\n" + member.username + "    " + this.Coin.format(member.amount);
		}

		await ctx.appResponse.sendMessage(ctx.chat.id, template);
	}
}
module.exports = NimbusCommand;
