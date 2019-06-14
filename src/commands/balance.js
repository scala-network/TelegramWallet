/**
 * A Telegram Command. Height basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */

const logSystem = "cmd/balance";

module.exports = {
	enabled: true,
	run: (ctx,callback) => {

		const ukey = [global.config.redis.prefix, 'Users' ,ctx.from.id].join(':');
		const wkey = [global.config.redis.prefix, 'Wallets' ,ctx.from.id].join(':');

		const cmds = [
			['hget', ukey, 'selected'],
			['lrange',wkey,[0,-1]]
		];


		global.redisClient.multi(cmds).exec((err, results) => {

			if(err) {
	        	callback(err);
	        	return;
			} 

			let output = "Wallets balance:\n";
			const jsonDetails = results[1];
			let totalBalance = 0;
			for(var i in jsonDetails) {

				const ObjectDetail = JSON.parse(jsonDetails[i]);
				output += '['+i+']';
				
				output +=' : ' + ObjectDetail.balance;

				if((results[0] === null && i == 0) || results[0] === i) {
					output += ' [s]';
				}

				totalBalance+=ObjectDetail.balance;
				output +='\n';
			}
			
			output+="Total Balance : " + totalBalance;
			ctx.reply(output);
			callback(null);
			return;	
		});
		
	},

	// notify:(d,c)=>{
	// 	c(true);
	// }
	
};
