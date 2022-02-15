const cluster = require('cluster');

module.exports = config => {
    const options = (() => {
        const options = {
            // connectionName: '@scalapool-connection',
            keepalive: config.keepalive === true ? 0 : (config.keepalive || 0),
            retryStrategy: function (options) {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    // End reconnecting on a specific error and flush all commands with
                    // a individual error
                    return new Error('Datasource/Redis: The server refused the connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    // End reconnecting after a specific timeout and flush all commands
                    // with a individual error
                    return new Error('Datasource/Redis: Retry time exhausted');
                }
                if (options.attempt > 10) {
                    // End reconnecting with built in error
                    return undefined;
                }
                // reconnect after
                return Math.min(options.attempt * 100, 3000);
            },
            db: config.db || 0
        };

        if (config.username) {
            options.username = config.username;
        }
        if (config.password) {
            options.password = config.password;
        }
        return options;
    })();
    const client = require('ioredis').createClient(config.host || '127.0.0.1', config.port || 6379, options);

    client.on('error', err => {
        console.log(`Datasource/Redis: Error on redis with code : ${err.code}`, err);
        if (err.code === 'ECONNREFUSED') {
            return process.exit();
        }
    });
    client.on('disconnect', err => {
        console.log(`Datasource/Redis: Disconnect on redis with code : ${err.code}`, err);
        if (err.code === 'ECONNREFUSED') {
            return process.exit();
        }
    });

    (async () => {
        const info = await client.info();

        if (!info) {
            global.log('error', 'Datasource/Redis: Redis version check failed');
            return process.exit();
        }

        const parts = info.split('\r\n');
        let versionString;
        let version;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].indexOf(':') !== -1) {
                const valParts = parts[i].split(':');
                if (~['redis_version'].indexOf(valParts[0].toLowerCase())) {
                    versionString = valParts[1];
                    version = parseFloat(versionString);
                    if (version === 0) {
                        versionString = '';
                        continue;
                    }
                    break;
                }
            }
        }

        if (!version) {
            global.log('error', 'Datasource/Redis','Could not detect redis version - must be super old or broken');
            return process.exit();
        }

        if (version < 5.0) {
            global.log('error', `Datasource/Redis`, `You're using redis version ${versionString} the minimum required version is 2.6. Follow the damn usage instructions...`);
            return process.exit();
        }
        global.log('info', `Datasource/Redis`, `Version checked ${version}`);
        // client.disconnect();
    })();

    return client;
};
