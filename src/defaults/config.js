module.exports = {
	/**
	 *  SINGLE WALLET MODE
	 *  when swm:true
	 *  Account create will be
	 *  a subaddress
	 **/
	coin: 'xla',
	swm: true,
	log: {
		files: {
			enabled: false,
			level: 'error',
			directory: 'logs',
			flushInterval: 5
		},
		console: {
			enabled: true,
			level: 'info',
			colors: true
		}
	},
	datasource: {
		engine: 'redis',
		// "path" :  "/path/to/socket/or/remove/key",
		address: '127.0.0.1',
		port: 6379,
		db: 5,
		keepalive: true,
		auth: false,
		prefix: null
	},

	admins: []
};
