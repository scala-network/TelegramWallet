const logSystem = 'registry/command';

class CommandManager {
	#_commands = {};
	constructor(bot) {
		const allowCommands = global.config.commands.allowed;
		for(let i =0; i < allowCommands.length;i++) {
					
			let c = allowCommands[i];
			let o;
			if(c in this.#_commands) {
				o = this.#_commands[c];
			} else {
				const cc = require('../commands/' + c + 'Command.js');
				o = new cc();

				
			}
			if(!o.enabled) {
				continue;
			}
			this.#_commands[c] = o;
	
		}
	}

	getCommands() {
		return this.#_commands;
	}
	getCommand(cmd) {
		if(cmd in this.#_commands) {
			return this.#_commands[cmd]; 
		}

		return false;
	}

	setCommandContext(cmd, ctx) {
		
		const c = this.getCommand(cmd);

		if(!c || !c.enabled || ctx.from.is_bot) return;
		//if query /donate address
		//we remove /donate and just get address
		let query = ctx.message.text.replace(`/${cmd}`,'').trim();
		let args = [];
		if(query !== "") {
			args = query.split(' ');
		} else {
			query = null;
		}
		const is_group = ctx.message.chat.type == "group" ||  ctx.message.chat.type == "supergroup";

	    const appRequest = {
	        is: {
	            admin : global.config.admins.indexOf(ctx.from.id) >= 0,
	            group : is_group,
	            user : !is_group && ctx.message.chat.type != "channel" || ctx.message.chat.type === 'private'
	        },
	        action: cmd,
	        query : query,
	        args : args
	    };
	    ctx.appRequest = appRequest;
	    ctx.sendToAdmin = msg => {
	    	console.log("We have an error");
	    	console.log(appRequest);
	    	console.error(msg);
	    };

		c.exec(ctx);

	}

	setBot(bot) {
		const allowCommands = Object.keys(this.#_commands);
		const self = this;
		for(let i =0; i < allowCommands.length;i++) {
					
			let c = allowCommands[i];
			const cmd = self.getCommand(c);

			if(!cmd || !cmd.enabled) return;
			global.log('info',logSystem, "Initializing command/%s", [c]);
			
			bot.command(c,ctx => {
				self.setCommandContext(c,ctx)
			});
		}
	}
}


module.exports = bot => {
	if(!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
}