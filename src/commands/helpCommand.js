const Command = require('./BaseCommand');

class HelpCommand extends Command {
	enabled = true;
	get description() {
		return "shows all commands avaliable";
	}
	get name() {
		return "name";
	}

	async run(ctx) {
		if(ctx.test)  return;

		let output = "";
		let cmd;
		if(ctx.appRequest.args.length > 0) {
			const name = ctx.appRequest.args[0];
			cmd = global.CommandManager.getCommand(name);
			if(cmd) {
				output += cmd.description;	
			} else {
				output += `Invalid command ${name}. Run /help for all avaliable commands`;
			}
			
		} else {
			const commands = global.CommandManager.getCommands();
			const commandLists = Object.keys(commands);
			for(let i = 0; i < commandLists.length;i++) {
				const cmdName = commandLists[i];
				cmd = commands[cmdName];
				if(cmd.auth(ctx.appRequest)) {
					output += `/${cmdName} - ${cmd.description}\n`;		
				}
			}	
		}
		
		ctx.reply(output);

	}
}

module.exports = HelpCommand;