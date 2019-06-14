const logSystem = 'registry/command';

const cache = {};

const allowCommands = [
    'start',
    'height',
    'create',
    'balance',
    'address'
];


module.exports = {

	map: function(callback) {

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

			if(!o.hasOwnProperty('run')) {
				callback("Invalid run for "+c);
				continue;
			}
			callback(null,c,o.run);
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
