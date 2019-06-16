module.exports = {
	subscribe:  function(context,wallet, callback){

		let filename = context.from.id;

		let i = context.query.passes[0] || 0;
		let password = context.query.passes[1] || false;

		let p = path.join(global.config.rpc.dir, filename+'_'+i);

		if (fs.existsSync(p)) {
			
			context.response.message = 'Unable to create already exists wallet';
			context.response.id = context.from.id;

			Queue.pub(context,function(e) {
				callback(e || 'Wallet already exists');
			});
			return;
		}

		filename = filename+'_'+i

	    // Make a request for a user with a given ID

        let processFlow = [];

        processFlow.push(function(next) {
            const options = {
                filename:filename,
                language:"English",
            };
            if(password) {
                options.password = password;
            }

            wallet.create(options,next);
        });


        processFlow.push(function(next) {

            wallet.sync((er) => {
                next(er, response);
            });

        });
        processFlow.push(function(response, next) {
            
            context.response.results = response;
            context.response.id = wallet.user_id;
            context.response.message = 'Wallet created successfully.\nAddress: \n' + wallet.address;

            Queue.pub(context,function(e) {
                if(e) {
                    next(e);
                    return;
                }
                next(null);
            });

        });

        async.waterfall(processFlow,callback);
	}
}