'use strict';
/**
* A Telegram Command. Just some random function returns a random selection from input
*
* @module Commands/random
*/
const Command = require('../base/command');

class RandomCommand extends Command {
	get name () {
		return 'random';
	}

	get description () {
		return 'Just some random function returns a random selection from input. usage /random 1 2 3 4 5 6';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;
		let randoms = [];
		const args = ctx.appRequest.args;
		if(args.length <= 0) {
			return ctx.appResponse.reply("Missing argument." + this.description);
		}
		

		let scores = {};
		for (const _uname of args) {
			if (!_uname || !_uname.trim()) continue;
			randoms.push(_uname);
			scores[_uname] = 0;
		}
		const max = 100;

		for (let i = 0;i < max;i++) {
			let aRandoms = randoms.sort(() => Math.random() - 0.5).sort(() => Math.random() - 0.5).sort(() => Math.random() - 0.5);
			let select = Math.floor(Math.random() * aRandoms.length);	
			const choosen = aRandoms[select];
			scores[choosen]++;
		}
		let scoreboard = "\n";
		for(let[k,v] of Object.entries(scores)) {
			scoreboard += k + " => " + v + "\n";
		}

		ctx.appResponse.reply("Randomly pick "+scoreboard);
	}
}
module.exports = RandomCommand;
