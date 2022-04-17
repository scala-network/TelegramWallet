
let output = {};

if (global.config.datasource.engine === 'redis') {
	output = {
		engine: 'redis',
		// "path" :  "/path/to/socket/or/remove/key",
		address: '127.0.0.1',
		port: 6379,
		db: 5,
		keepalive: true,
		auth: false,
		prefix: null
	};
}

module.exports = output;
