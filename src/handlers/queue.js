const Queue = require('../handlers/queue');
const async = require('async');
const qKey = [global.config.redis.prefix,"Queue"].join(':');
const nKey = [global.config.redis.prefix,"Notify"].join(':');

const abstract = 
{
	push: function(key, context, callback) {
         redisClient.rpush(key, JSON.stringify(context), function(error) {
         	callback(error);
         });
	},
	pop:function(key,cb) {
		async.waterfall([
			function(callback) {
				redisClient.llen(key, function(e,d){
		            if (e) {
		                callback(e);
		                return;
		            }
		            if(d == 0) {
		            	callback('No new notification.');
						return;
		            }
			    	callback(null);
		        });
			},
			function(callback) {
				redisClient.lpop(key,(error,context) => {
		            if (error) {
		                callback(null,error);
		                return;
		            }

		            callback(null,null,context);
		        });
			},
			function(error, data, callback) {
				if(error) {
					redisClient.rpush(key, data, (e) => {
			            callback(e || error);
			        });
			        return;
				}
				const context = JSON.parse(data);
				callback(null,context);
			}
		],cb);
	},
	count:function(callback) {
		redisClient.llen(key,function(e,d){
            if (e) {
                callback(e);
                return;
            }

            callback(null,d);
        });
	}
}

module.exports = {
	push: function(context, callback) {
		abstract.push(qKey, context, callback);
	},
	pop:function(callback) {
		abstract.pop(qKey, callback);
	},
	count:function(callback) {
		abstract.count(qKey, callback);
	},
	pub: function(context, callback) {
		abstract.push(nKey, context, callback);
	},
	sub:function(callback) {
		abstract.pop(nKey, callback);
	},
	pendings:function(callback) {
		abstract.count(nKey, callback);
	},
}
