/**
 * This is the main wrapper for redis as db
 * @module interfaces/redis
 */

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

global.redisClient = require('redis').createClient(config);
    
redisClient.on('error', function (err) {
    log('error',logSystem, "Error on redis with code : %j",[err]);
});