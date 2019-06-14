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
require('./src/interfaces/redis');


const rpcRequest = require("./src/interfaces/request");
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

let RPC = require("./src/handlers/rpc");
let Queue = require("./src/handlers/queue");
const eventCache = {};

async.each(global.config.rpc.servers,function(server,eachCallback) {

    const rpc = new RPC(server);

    async.forever(function(next) {

        const onPop = function(onper, context) {

            if(onper) {
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

                rpc.context = context;

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
                       const action = context.request.action;

                        if(!eventCache.hasOwnProperty(action)) {
                            const fileLoc = path.join(__dirname,'src','events', action + '.js');
                            if(!fs.existsSync(fileLoc)){
                                callback("Invalid event for rpc action " + action + 'at path :' + fileLoc);
                            }

                            eventCache[action] = require('./src/events/' +action);
                            return;
                        }

                        if(!eventCache[action].hasOwnProperty('subscribe')){
                            callback("Invalid event subscribe request for rpc action " + action);
                            return;
                        }

                        eventCache[context.request.action].subscribe(rpc, callback);
                    }],
                    function(error) {
                        if(error) {
                            if(typeof error == 'string') {
                                log('error',logSystem, "Error RPC : %s", [error]);
                            } else {
                               log('error',logSystem, "Error RPC : %j", [error]);
                            } 
                       }

                       async.series([
                            function(callback) {
                                rpc.wallet.close((error) => {
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
                                log('error',logSystem, "After RPC Error : %j", [serror]);
                            }
                            for(var i in results) {
                                var e = results[i];
                                if(!e) {
                                    continue;
                                }

                                log('error',logSystem, "After RPC Error : %j", [e]);
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
