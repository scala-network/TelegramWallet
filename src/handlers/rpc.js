
const path = require('path');
const fs = require('fs');
const async = require('async');
const logSystem = "handlers/rpc";
const httpRequest = require('../interfaces/request');
const Wallet = require('../interfaces/wallet');
const Queue = require('../handlers/queue');

module.exports = function (rpc_details) {

	const self = this;
	this.details = rpc_details;
    this.context = null;
    this.wallet = new Wallet(self);

    self.request = function(method, params, callback){
    	async.waterfall([
    		function(next) {
    			if(method === 'create_wallet') {
    				next(null);
    				return;
    			}

    			self.wallet.open((er) => {
    				if(er) {
    					next(er);
    					return;
    				}
    				next(null);
    			});
    		},
    		function(next) {

    			if(method === 'create_wallet') {
    				next(null);
    				return;
    			}

    			self.wallet.reSync((er) => {
    				if(er) {
    					next(er);
    					return;
    				}
    				next(null);
    			});
    		},
    		function(next) {

    			httpRequest.post(self.details,method,params,(err,response) => {
    				if(err) {
    					next(err);
    					return;
    				}
    				if(method == 'create_wallet') {
    					self.wallet.file = params.filename;
    				} else {
    					self.wallet.idx = 0;
    				}
    				next(null,response);
    			});
    		},
    		function(response,next) {

    			self.wallet.reSync((er) => {
    				next(er, response);
    			});
    		},
    		function(response, next) {


                const context = self.context;
    			context.response = response;
                console.log(context);
    			Queue.pub(context,function(e) {
    				if(e) {
    					next(e);
    					return;
    				}
    				next(null);
    			});
    		}],(error) =>{

    
                callback(error);
            });
    };

}
