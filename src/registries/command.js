const logSystem = 'registry/command';
const Registeries = require('./registries');

class CommandManager extends Registeries {

	get registerName() {
		return "Command";
	}


	setCommandContext(cmd, ctx) {
		const c = this.getRegister(cmd);

		if(!c || !c.enabled || ctx.from.is_bot) return;
		//if query /donate address
		//we remove /donate and just get address
		let query = ctx.message.text.replace(`/${cmd}`,'').trim();
		if(query.startsWith(global.config.bot.name)) {
			query = query.replace(global.config.bot.name,'').trim();
		}
		let args = [];
		if(query !== "") {
			args = query.split(' ');
		} else {
			query = null;
		}

	    ctx.sendToAdmin = msg => {
	    	console.log("We have an error");
	    	console.log(appRequest);
	    	console.error(msg);
	    };

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


		c.exec(ctx);

	}

	
}


module.exports = bot => {
	if(!global.CommandManager) {
		global.CommandManager = new CommandManager();
	}
	global.CommandManager.setBot(bot);
}