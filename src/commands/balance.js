/**
 * A Telegram Command. Balance basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */

const logSystem = "cmd/balance";

module.exports = {
    getSummary:function() {
        return  "Returns wallet(s) balance ";
    },
    getDescription:function() {
        return "\
 	Balance basically return all wallet(s) balance.\n\
	/balance for spesific wallet /balance <index>\n\
	@module Commands/height\n\
";
    },
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
			if(jsonDetails) {
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
				
				ctx.reply(output);
			} else {
				output +='No wallet avaliable';
			}
			output+="Total Balance : " + totalBalance;
			
			callback(null);
			return;	
		});
		
	},

	// notify:(d,c)=>{
	// 	c(true);
	// }
	
};
