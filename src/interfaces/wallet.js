const Request = require('../interfaces/request');
const async = require("async");
const path = require('path');
const fs = require('fs');

const logSystem = "interfaces/wallet";

module.exports = function (server_details) {
	const self = this;
	self.idx=-1;
	self.file=null;
	self.height=0;
	self.balance=0;
	self.last_updated=null;
	self.address=null;
	self.password=null;
	self.user_id = -1;
	self.server = server_details;


	let daemonHeight = 0;
	self.store = function(callback, clear) {

		const key = [global.config.redis.prefix, 'Wallets',self.user_id].join(':');
		const data = {
			file:self.file,
			height:self.height,
			balance:self.balance,
			address:self.address,
			last_updated: self.last_updated,
			last_updated: self.password
		};

		const jsonData = JSON.stringify(data);

		if(self.idx >= 0) {

			redisClient.lset(key, self.idx, jsonData,(error) => {
				
				if(clear === true) {
					self.idx = -1;
					self.file = null;
					self.address = null;
					self.height = 0;
					self.balance = 0;
					self.password=null;
					self.user_id = -1;
				}

				callback(error);
			});

			return;
		}

		redisClient.lpush(key, jsonData,(error) => {
			
			if(clear === true) {
				self.idx = -1;
				self.file = null;
				self.address = null;
				self.height = 0;
				self.balance = 0;
				self.password=null;
				self.user_id = -1;
			}
			
			callback(error);

		});
	},
	self.close = function(callback){

		if(self.file == null){
			callback(null);
			return;
		}

		log("info",logSystem,"Wallet is closing for %s", [self.file]);

		Request.post(_rpc.details,'close_wallet', {}, (error,data) => {
			log("info",logSystem,"Wallet is closed for %s", [self.file]);

			if(error) {
				callback(error);
				return;
			}

			self.store(callback,true);

		});
	};

	self.setWalletAtIdx = (idx, cb) => {

		if (idx == -1) {
			cb("Unable to get index for wallet");
			return false;
		}

		self.idx = idx;
		const key = [global.config.redis.prefix, 'Wallets',self.user_id].join(':');
		redisClient.lindex(key, idx,(er, re) => {
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

			cb(null);
		});
	};
	self.open = (callback) => {

		if(self.file === null){
			callback("No wallet file set");
			return;
		}
		const ff = path.join(global.config.rpc.dir,self.file);
		if(!fs.exists(ff)) {
			callback("No wallet file exists");
			return;
		}

		Request.post(_rpc.details,'open_wallet', {
			filename:self.file,
		}, (e,d)=> {
			if(e) {
				callback(e);
				return;
			}

			callback(null);
		});
	};

	self.getAddress = (callback) => {


		Request.post(_rpc.details,'get_address', {account_index:0,address_index:[0]},(error,response) => {
			if(error) {
				callback(error);
				return;
			}

			self.address = response.result.address;
			const now = new Date();
			self.last_updated = now.getTime();
			callback(null,self.address);
		});
	}


	self.getBalance = (callback) => {
		Request.post(_rpc.details,'get_balance', {account_index:0,address_index:[0]},(error,response) => {
			if(error) {
				callback(error);
				return;
			}

			const now = new Date();
			self.last_updated = now.getTime();
			self.balance = response.result.balance;
			callback(null,self.balance);
		});
	};

	self.getHeight = (callback) => {
		Request.post(_rpc.details,'get_height',{},(error,response) => {
			if(error) {
				cb(error);
				return;
			}
			const now = new Date();
			self.last_updated = now.getTime();
			self.height = response.result.height;
			callback(null,self.height);
		});
	};

	self.create = (options, callback) => {
		Request.post(self.details,'create_wallet',options,(err,response) => {
            if(err) {
                callback(err);
                return;
            }

            self.wallet.file = params.filename;
            self.wallet.idx = options.split('_')[1];

            callback(null,response);
        });
	}

	self.sync =(cb) => {


		const now = new Date();
		const m1b = new Date(now.getTime() - 1*60000);

		if(	self.height > 0 && daemonHeight > 0 && self.height >= daemonHeight ) { 
			log("info",logSystem,"Wallet already at sync at %s / %s for %s", [self.height, daemonHeight, self.file]);
			cb(null);
			return;
		}

		log("info",logSystem,"Wallet starts syncing at %s / %s for %s", [self.height, daemonHeight, self.file]);
		//expired
		async.waterfall([
			function(callback) {
				redisClient.get([global.config.redis.prefix, 'daemon','height'].join(':'),(e,daemon_height) => {
					if(e) {
						callback(e);
						return;
					}

					callback(null,daemon_height);
				});
			},
			function(daemon_height,callback) {
				daemonHeight = daemon_height;

				async.whilst(
					function test(next) {
						next(null, daemon_height > self.height);
					},
					function iter(next) {

						setTimeout(() => { 
							self.getHeight((error, wallet_height) => {
			
								if(error) {
									log("error",logSystem,"Wallet height at %s / %s for %s with error : ", [self.height, daemonHeight, self.file, err]);
									next(error);
									return;
								}

								log("info",logSystem,"Wallet height %s / %s for %s", [wallet_height, daemon_height, self.file]);

								next(null);
							});
						},global.config.rpc.interval);

				}, function done (error) {
					if(error) {
						log("error",logSystem,"Wallet stop syncing at %s / %s for %s with error : ", [self.height, daemonHeight, self.file, err]);
						callback(err);
						return;
					}

					log("info",logSystem,"Wallet stop syncing at %s / %s for %s", [self.height, daemonHeight, self.file]);

					callback(null);
				});
			},
			function(callback) {

				self.getAddress(function(error,address) {
					if(error){
						callback(error);
						return;
					}
					callback(null);
				});
			},
			function(callback) {

				self.getBalance(function(error,balance) {
					if(error){
						callback(error);
						return;
					}
					callback(null);
				});
			},
			function (callback) {
				self.store(function(error) {
					if(error){
						callback(error);
						return;
					}
					callback(null);
				});
			}
			],(error) => {
				cb(error);
			});
	};

	self.transfer = function(address, amount, mixin, ring_size, payment_id, callback) {
		Request.post(self.details,'transfer',{
			destinations:[
				amount:amount,
				address:address
			],
			priority:0,
			mixin:mixin,
			ring_size:ring_size,
			payment_id: payment_id,
			get_tx_key:true
		},(err,response) => {
            if(err) {
                callback(err);
                return;
            }
            const key = [global.config.redis.prefix, 'Transactions', self.user_id, self.idx].join(':');
            const data = [(new Date()).now(),JSON.stringify(response)];
            redisClient.lset(key,data,function(e,r) {
            	if(e) {
	                callback(e);
	                return;
	            }
            	callback(null,response);
            })
        });
	};

	return self;
}
