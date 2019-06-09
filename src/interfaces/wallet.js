


module.exports = (rpc) => {
	const self = this;
	self.idx=-1;
	self.file=null;
	self.height=null;
	self.balance=null;
	self.last_updated=null;
	self.address=null;
	let _rpc = null;

	let daemonHeight = 0;

   self.close = (cb) => {
		const cw = httpRequest.setup(_rpc.details,'close_wallet');
	    httpRequest.post(cw)
	    .finally(() => {
			self.idx = -1;
			self.file = null;
			self.address = null;
			self.height = null;
			self.balance = null;
			_rpc.status = 0;

			const key = [global.config.redis.prefix,"Users",_rpc.context.from.id].join(':');
			global.redisClient.hset(key,'status',0);
	};

	self.setRpc = (rpc) => {
		if(_rpc) {
			self.close(() => {
				_rpc = rpc;
				_rpc.status = 1;
			});
		} else {
			_rpc = rpc;
			_rpc.status = 1;
		}
	};


	self.getWalletAtIdx = (idx, cb) => {

		if (idx == -1) {
			cb(true);
			return false;
		}

		self.idx = idx;
		const keygen = [global.config.redis.prefix, 'Wallets',_rpc.context.from.id].join(':');
		redisClient.lindex(keygen, self.idx,(er, re) => {
			if(er) {
				cb(er);
				return;
			}
			const jsonData = JSON.parse(re);
			self.file = jsonData.file;
			self.height = jsonData.height;
			self.address = jsonData.address;
			self.balance = jsonData.balance;
			self.last_updated = jsonData.last_updated;

			self.reSync(cb);
		});
    };

	self.setWalletFile = (filename,cb) => {
    	if((self.file !== null && self.file !== filename ) ||  _rpc.status === 1){
    		cb(true);
    		return;
    	}

		const req = httpRequest.setup(_rpc.details,'open_wallet', {
			filename:filename,
			language:"English"
		});

		httpRequest.post(req).then(res => {
        	cb(null, res, req);
        }).catch(err => {
			cb(err, null, req);
        }).finally(()=>{
        	self.file = filename;
        });
    };

    self.getWalletAddress = (cb) => {
    	if(self.address !== null) {
    		cb(self.address);
    		return;
    	}

    	const wa = httpRequest.setup(_rpc.details,'get_address', {account_index:0,address_index:[0]},);
        httpRequest.post(wa).then(response => {
        	self.address = response.results.address;
        	cb(self.address);
        });
    }


    self.getWalletBalance = (cb) => {
    	if(self.balance !== null) {
    		cb(self.balance);
    		return;
    	}

		const wb = httpRequest.setup(_rpc.details,'get_balance', {account_index:0,address_index:[0]});

		httpRequest.post(wb).then(response => {
        	self.balance = response.result.balance;
        	cb(self.balance);
        });
    };

    self.reSync = (cb) => {
		const now = new Date();
        const m1b = new Date(now.getTime() - minutes*60000);

        if(	
        	self.last_updated >= m1b || 
        	(self.height !== null && daemonHeight !== 0 && self.height >= daemonHeight)
        ) { 
        	cb(false);
        	return;
        }
		//expired
    	const p = httpRequest.setup(_rpc.details,'get_height');
     	httpRequest.post(p).then(res => {
     		redisClient.get([global.config.redis.prefix, 'daemon','height'].join(':'),(e,r) => {

    			const lu = self.last_updated = now.getTime();
				daemonHeight = parseInt(r);
				const wh = self.height = parseInt(res.results.height);
        		if(self.height < daemonHeight) {
            		setTimeout(() => { self.reSync(cb);},global.config.rpc.interval);
            		return;
                } 
            
				self.balance = null;

				self.getWalletAddress((wa) => {
					self.getWalletBalance((wb) => {
						const keygen = [global.config.redis.prefix, 'Wallets',_rpc.context.from.id].join(':');
						if(self.idx >= 0) {
							redisClient.lset(keygen, self.idx, JSON.stringify({
								file:self.file,
								height:wh,
								balance:wb,
								address:wa,
								last_updated: lu
							}),(er, re) => {
								cb(er);
							});
						} else {
							redisClient.lpush(keygen, JSON.stringify({
								file:self.file,
								height:wh,
								balance:wb,
								address:wa,
								last_updated: lu
							}),(er, re) => {
								cb(er);
								if(re) {
									self.idx = parseInt(re);
								}
							});
						}

					});
				});
        	});
     	});
    }

	self.setRpc(rpc);

    return self;
}