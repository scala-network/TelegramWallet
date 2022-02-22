'use strict'
/**
 * A Telegram Command. Display rank on most earn by rain 
 * 
 * @module Commands/address
 */
const Command = require('../base/command');

class WetCommand extends Command {
	enabled = true;

	get name() {
        return "wet";
    }
	
	get description() {
		return "Who gets the most rain";
	}

	auth(ctx) {
		return ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		const results = await Member.findWet(ctx.chat.id);

		if(results.overall.length <= 0) {
			return ctx.appResponse.reply("It haven't been raining");
		}

		let template = `** Wettest Today **`;

		for(let i =0;i< results.today.length;i++) {
			const member = results.today[i];
			template+"\n@" + results.member.username + "    " + this.Coin.format(member.amount);
		}

		template = `\n** Wettest All Time **`;

		for(let i =0;i< results.overall.length;i++) {
			const member = results.overall[i];
			template+"\n@" + results.member.username + "    " + this.Coin.format(member.amount);
		}

		await ctx.appResponse.sendMessage(ctx.chat.id, template);
	}
}
module.exports = WetCommand;
