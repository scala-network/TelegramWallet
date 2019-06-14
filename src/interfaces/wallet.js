const Request = require('../interfaces/request');
const async = require("async");
const path = require('path');
const fs = require('fs');

const logSystem = "handlers/rpc";

module.exports = function (rpc) {
	const self = this;
	self.idx=-1;
	self.file=null;
	self.height=0;
	self.balance=null;
	self.last_updated=null;
	self.address=null;
	let _rpc = rpc;

	let daemonHeight = 0;
	self.store = function(callback, clear) {

		const key = [global.config.redis.prefix, 'Wallets',_rpc.context.from.id].join(':');
		const data = {
			file:self.file,
			height:self.height,
			balance:self.balance,
			address:self.address,
			last_updated: self.last_updated
		};

		const jsonData = JSON.stringify(data);

		if(self.idx >= 0) {

			redisClient.lset(key, self.idx, jsonData,(error) => {
				
				if(clear === true) {
					self.idx = -1;
					self.file = null;
					self.address = null;
					self.height = 0;
					self.balance = null;
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
				self.balance = null;
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
		const key = [global.config.redis.prefix, 'Wallets',_rpc.context.from.id].join(':');
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

	self.reSync = (cb) => {


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


	return self;
}
