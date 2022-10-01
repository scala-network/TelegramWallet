module.exports = {
	/**
	 *  SINGLE WALLET MODE
	 *  when swm:true
	 *  Account create will be
	 *  a subaddress
	 **/
	rpc: {
		interval: 1, // in seconds
		metaTTL: 60
	},
	coins: ['xla'],
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
		redis: {
			engine: 'redis',
			host: '127.0.0.1',
			port: 6379,
			db: 5,
			keepalive: true,
			auth: false,
			prefix: null
		},
		mysql: {
			engine: 'mysql2',
			host: '127.0.0.1',
			port: 3306,
			db: 'database',
			keepalive: true,
			username: 'username',
			password: 'password'
		}
	},

	admins: []
};
