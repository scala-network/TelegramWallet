/**
 * This is the main wrapper for redis as db
 * @module engine/redis
 */
const logSystem = "engine/redis";

const { createNodeRedisClient } = require('handy-redis');


//delete global.config.datasource;

module.exports = conf => {
    const redisConfig = {
        db: conf.db ? conf.db : 0,
        socket_keepalive:conf.keepalive?conf.keepalive:true,
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
        auth_pass:conf.auth?conf.auth:null
    };
    
    if(conf.path) {
        redisConfig.path = conf.path;     
    } else {
        redisConfig.address = conf.address;
        redisConfig.port = conf.port;
    }

    const redisClient = createNodeRedisClient(redisConfig);
    
    redisClient.nodeRedis.on('error', function (err) {
        log('error',logSystem, "Error on redis with code : %j",[err]);
    });

    return redisClient;

}