/**
 * A Telegram Command. Height basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */

const logSystem = "cmd/height";

module.exports = {
	enabled: true,
	run: (ctx,callback) => {

		const key = [global.config.redis.prefix, 'daemon' ,'height'].join(':');
		const ukey = [global.config.redis.prefix, 'Users' ,ctx.from.id].join(':');
		const wkey = [global.config.redis.prefix, 'Wallets' ,ctx.from.id].join(':');

		const cmds = [
			['get', key],
			['hget', ukey, 'selected'],
			['lrange',wkey,[0,-1]]
		];


		global.redisClient.multi(cmds).exec((err, results) => {
			if(err) {
	        	callback(err);
	        	return;
			} 

			let output = "Daemon height: " + results[0] +" \n";
			output += "Wallets height:\n";
			const jsonDetails = results[2];
			for(var i in jsonDetails) {

				const ObjectDetail = JSON.parse(jsonDetails[i]);
				output += '['+i+']';
				
				output +=' : ' + ObjectDetail.height;

				if((results[1] === null && i == 0) || results[1] === i) {
					output += ' [s]';
				}
				output +='\n';

			}
			ctx.reply(output);
			callback(null);
			return;	
		});
		
	},

	// notify:(d,c)=>{
	// 	c(true);
	// }
	
};
