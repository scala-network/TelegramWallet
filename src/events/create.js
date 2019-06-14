
module.exports = {
	publish: function() {

	},
	subscribe:  function(rpc, callback){

		let filename = context.from.id;

		let i = 0;

		while(true) {
			try {
				let f = filename;
				f += (i === 0) ? '' : i;

				let p = path.join(global.config.rpc.dir, f);

				if (fs.existsSync(p)) {
					i++;
				} else {
					filename = f;
					break;
				}

			} catch(err) {
				callback("Create wallet file error");
				return;
			}
		}
	    // Make a request for a user with a given ID
	    rpc.request('create_wallet', {filename: filename, "language":"English"}, e => {
	    	if(e) {
	    		callback({
	    			error:e,
	    			filename:filename,
	    			language:"English",
	    			method:'create_wallet',
	    			context:context,
	    		});
	    		return;
	    	}
	    	callback(null);
	    });

	}
}