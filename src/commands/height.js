/**
 * A Telegram Command. Height basically returns daemon and wallet(s) height.
 * To return all heights do /height
 * To a height for a selected wallet at index do /height <index> eg. /height 3
 * @module Commands/height
 */

const logSystem = "cmd/height";

module.exports = {

	description:"Height basically returns daemon and wallet(s) height.\n\
 To return all heights do /height\n\
 To a height for a selected wallet at index do /height <index> eg. /height 3",


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

			if(jsonDetails) {

				for(var i in jsonDetails) {

					const ObjectDetail = JSON.parse(jsonDetails[i]);
					output += '['+i+']';

					output +=' : ' + ObjectDetail.height;

					if((results[1] === null && i == 0) || results[1] === i) {
						output += ' [s]';
					}
					output +='\n';

				}
			} else {
				output +='No wallet avaliable';
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
