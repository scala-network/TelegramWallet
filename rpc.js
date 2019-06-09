const path = require('path');
const fs = require('fs');

const configFile =  path.join(__dirname,'config.json');
const logSystem = 'event';
const cluster = require('cluster');

require('./src/log');

const redis = require('redis');

try {
    const rfs = fs.readFileSync(configFile);
    global.config = JSON.parse(rfs);
} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}

const redisConfig = {
    db: global.config.redis.hasOwnProperty('db') ? global.config.redis.db : 0,
    socket_keepalive:global.config.redis.hasOwnProperty('keepalive')?global.config.redis.keepalive:true,
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            log('error', logSystem,'The server refused the connection');
            return;
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },
    auth_pass:global.config.redis.hasOwnProperty('auth')?global.config.redis.auth:null
};

if(global.config.redis.hasOwnProperty('path')) {
    redisConfig.path = global.config.redis.path;     
} else {
    redisConfig.address = global.config.redis.address;
    redisConfig.port = global.config.redis.port;
}

global.redisClient = redis.createClient(config);
    
redisClient.on('error', function (err) {
    log('error',logSystem, "Error on redis with code : %j",[err]);
});

if (cluster.isMaster) {

    const workers = [];

    const key = [global.config.redis.prefix,"RPC","*"].join(':');
    redisClient.keys(key,(err,data) => {
        for(let i = 0; i < data.length; i++) {
            redisClient.del(data[i]);
        }
    })
            
    const env = {workerType:'daemon'},
    const worker = cluster.fork(env);
    worker.process.env = env;

    for (var i = 0; i < global.config.rpc.servers.length; i++) {
        setTimeout(function() {
            
            const env = {workerId: workers.length + 1, detail: global.config.rpc.servers[workers.length],workerType:'rpc'},
            const worker = cluster.fork(env);
            worker.process.env = env;
            workers.push(worker);

        }, global.config.rpc.interval * i);
    }


    cluster.on('exit', function(worker, code, signal) {
        log('warning',logSystem,'Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        const env = worker.process.env,
        const newWorker = cluster.fork(env);
        newWorker.process.env = env;
    });


    return;
}
const workerType = process.env.workerType;
switch(workerType) {
    case 'daemon':
        const httpRequest = require("./src/interfaces/request");
        httpRequest.setup();
    break;
    case 'rpc':
        let RPC = require("./src/handler");

        const qKey = [global.config.redis.prefix,"Queue"].join(':');

        const rpcHandler = new RPC(process.env.detail);

        const main = () => {

            if(rpcHandler.status === 1) {
                setTimeout(main, global.config.rpc.timeout);
                return;
            }

            redisClient.lpop(qKey, (er,data) => {

                if(er || !data) {
                    if(data) {
                        redisClient.rpush(qKey,data);
                    }
                    setTimeout(main, global.config.rpc.timeout);
                    return;
                }

                const o = JSON.parse(data);
                const key = [global.config.redis.prefix,"Users",o.ctx.from.id].join(':');
                global.redisClient.hget(key,'status',(e,r) => {
                    if(e || r == 1) {
                        redisClient.rpush(qKey,data,(ee,rr) => {
                            setTimeout(main, global.config.rpc.timeout);
                        });   
                        return;   
                    }
                    global.redisClient.hset(key,'status',1);
                    rpcHandler.execute(o,(error,response,request) => {
                         setTimeout(main, global.config.rpc.timeout);
                    });
                });
            });
        }

        main();
    break;
    default:
    require(global.app.src + '/modules/' + process.env.workerType);
    break;  
}

