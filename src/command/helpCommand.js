'use strict'
/**
 * A Telegram Command. Help all commands description.
 * By passing command as an argument help will display
 * the particular command's description only. 
 * eg. /help set
 * 
 * @module Commands/help
 */
const Command = require('../base/command');

class HelpCommand extends Command {

	get description() {
		return "shows all commands avaliable";
	}
	
	get name() {
		return "help";
	}

	async run(ctx) {
		if(ctx.test)  return;
		if(ctx.appRequest.is.bot) return;
		
		let output = "";
		let cmd;
		if(ctx.appRequest.args.length > 0) {
			const name = ctx.appRequest.args[0];
			cmd = global.CommandManager.getRegister(name);
			if(cmd) {
				output += cmd.description;	
			} else {
				output += `Invalid command ${name}. Run /help for all avaliable commands`;
			}
			
		} else {
			const commands = global.CommandManager.getRegisters();
			const commandLists = Object.keys(commands);
			for(let i = 0; i < commandLists.length;i++) {
				const cmdName = commandLists[i];
				cmd = commands[cmdName];
				if(cmd.auth(ctx)) {
					output += `/${cmdName} - ${cmd.description}\n`;		
				}
			}	
		}
		
		ctx.appResponse.reply(output);

	}
}

module.exports = HelpCommand;