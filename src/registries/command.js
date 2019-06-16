const logSystem = 'registry/command';

const cache = {};

const allowCommands = [
    'height',
    'create',
    'balance',
    'address'
];

const bindContextWithRequest = function(cmd, ctx) {

    const text = ctx.message.text;
    const args = text.split(' ');

    let pass;
    let passes;
    if(args.length > 1) {
        pass = ctx.message.text.replace('/' + cmd + " ",'');
        passes = pass.split(' ');
    } else {
        pass = '';
        passes = [];
    }

    const is_group = ctx.message.chat.type == "group" ||  ctx.message.chat.type == "supergroup";
    
    ctx.aRequest = {
        is: {
            admin : global.config.admins.indexOf(ctx.from.id) >= 0,
            group : is_group,
            user : !is_group && ctx.message.chat.type != "channel" || ctx.message.chat.type === 'private'
        },
        action: cmd,
        query : {
            pass:pass,
            passes:passes
        }
    };


    return ctx;
}

module.exports = {
	bindRequest:bindContextWithRequest,
	getSummaries: function(ctx) {
		const context = bindContextWithRequest('help',ctx);
		let output = "Avaliable commands : \n";

		output+="/help - Display more information regarding command";

		for(let i =0; i< allowCommands.length;i++) {
					
			let c = allowCommands[i];

			let o;
			
			if(cache.hasOwnProperty(c)) {
				o = cache[c];
			} else {
				o = require('../commands/' + c + '.js');
				cache[c] = o;
			}

			if(!o.enabled) {
				callback("Command disabled for "+c);
				continue;
			}
			output += '/' + c + ' - ';
			if(!o.hasOwnProperty('getSummary') || !o.getSummary()) {
				output+="No summary set yet";
			} else {
				output +=o.getSummary();
			} 
			output +='\n';
		}
		ctx.reply(output);
	},
	getDescriptions: function(ctx) {
		const context = bindContextWithRequest('help',ctx);

		const passLength = ctx.aRequest.query.passes.length;

        if(passLength  !== 1) {
            ctx.reply("Invalid argument for help. Requires 1 argument(s).\n\
            Command parameter is as /help <command> . eg. /help height");
            return;
        }

		const c = ctx.aRequest.query.passes[0];

		if(cache.hasOwnProperty(c)) {
			o = cache[c];
		} else {
			o = require('../commands/' + c + '.js');
			cache[c] = o;
		}
		if(!o.enabled) {
			log('info',logSystem, "Command disabled for " + c);
            return;
		}
		if(!o.hasOwnProperty('getDescription') || !o.getDescription()) {
			ctx.reply("No description set yet for "+c);
            return;
		}

		const description = o.getDescription();

		 ctx.reply(description);

	},
	map: function(callback) {

		for(let i =0; i< allowCommands.length;i++) {
					
			let c = allowCommands[i];

			if(c === 'help' || c === 'start') {
				continue;
			}

			let o;
			
			if(cache.hasOwnProperty(c)) {
				o = cache[c];
			} else {
				o = require('../commands/' + c + '.js');
				cache[c] = o;
			}

			if(!o.enabled) {
				callback("Command disabled for "+c);
				continue;
			}

			if(!o.hasOwnProperty('run')) {
				callback("Invalid run for "+c);
				continue;
			}



			callback(null,c,o);
		}
	},
	notify: function(action,data,callback) {
		
		if(!cache.hasOwnProperty(action)) {
			callback("Invalid action called from event "+action);
			return;
		}

		if(!cache[action].hasOwnProperty('notify')) {
			callback(false);
			return;
		}

		cache[action].notify(data, callback);
	}
}
