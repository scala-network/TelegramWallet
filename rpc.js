/**
 * RPC Script
 * Running rpc events directy to daemon. 
 * Telegram SDK does not directly communicate with
 * daemon.
 * @module RPC
 */


 const path = require('path');
 const fs = require('fs');
 const async = require('async');

 const configFile =  path.join(__dirname,'config.json');
 const logSystem = 'rpc';

 try {
    const rfs = fs.readFileSync(configFile);
    global.config = JSON.parse(rfs);

} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}

require('./src/log');
require('./src/engines/redis');


const rpcRequest = require("./src/engines/request");
let currentHeight = 0;

async.forever(function(next) {
    rpcRequest.post(global.config.daemon,'get_info', {}, (err,res) => {
        if(err) {
            log('error',logSystem,"Error on daemon get_info : %j", [err]);
            setTimeout(next, global.config.daemon.timeout);
            return;
        }

        if(currentHeight === res.result.height) {
            setTimeout(next, global.config.daemon.timeout);
            return;
        }

        currentHeight = res.result.height;

        log('info',logSystem, "New height detected %s", [currentHeight]);

        redisClient.set([global.config.redis.prefix,'daemon','height'].join(':'), currentHeight, () => {
            // it will result in this function being called again.
            setTimeout(next, global.config.daemon.timeout);
        });
    });
});

const noOfRpcServers = global.config.rpc.servers.length;
if(noOfRpcServers === 0 || global.config.rpc.enable === false) {
    return;
}

const Events = require("./src/registries/events");
const Wallet = require('./src/engines/wallet');
const Queue = require("./src/handlers/queue");
const eventCache = {};

async.each(global.config.rpc.servers,function(server,eachCallback) {

    const wallet = new Wallet(server);

    async.forever(function(next) {

        const onPop = function(on_pop_error, context) {

            if(on_pop_error) {
                setTimeout(next, global.config.rpc.timeout);
                return;
            }

            log('info',logSystem, "Queue popped from : " + context.from.username);
                    
            const key = [global.config.redis.prefix,"Users", context.from.id].join(':');
            global.redisClient.hget(key,'status',(err, status) => {

                if(err) {
                    Queue.push(context, (err) => {
                        log('error',logSystem, "Checking wallet status error %j", [err]);
                        setTimeout(next, global.config.rpc.timeout);
                   });   
                    return;   
                }  

                if(status == 1) {
                    Queue.push(context, (err) => {
                        log('error',logSystem, "User wallet is in process");
                        setTimeout(next, global.config.rpc.timeout);
                   });   
                    return;   
                }

                async.waterfall([
                    function(callback) {
                       global.redisClient.hset(key,'status', 1, function(error) {
                            if(error) {
                                Queue.push(context,(err) => {
                                   callback(err || error || "Flaggin wallet error");
                               });   
                                return;   
                            }

                            callback(null);
                        });
                    },
                    function(callback) {
                        Events(context,callback);
                    }],
                    function(error) {
                        if(error) {
                            if(typeof error == 'string') {
                                log('error',logSystem, "Error RPC Events : %s", [error]);
                            } else {
                               log('error',logSystem, "Error RPC Events : %j", [error]);
                            } 
                       }

                       async.series([
                            function(callback) {
                                wallet.close((error) => {
                                    callback(null,error);
                                });
                            },
                            function(callback) {
                                redisClient.hset(key, 'status',0, (error) => {
                                     callback(null,error);
                                });
                            }
                        ],
                        function(serror, results) {
                            if(serror) {
                                log('error',logSystem, "After RPC Events Error : %j", [serror]);
                            }
                            for(var i in results) {
                                var e = results[i];
                                if(!e) {
                                    continue;
                                }

                                log('error',logSystem, "After RPC Events Error : %j", [e]);
                            }
                            setTimeout(next, global.config.rpc.timeout);
                        });

                     }
                );
            });
            
        }


        try{
           Queue.pop(onPop);
        } catch(e) {
            setTimeout(next, global.config.rpc.timeout);
        }

    });
});	
