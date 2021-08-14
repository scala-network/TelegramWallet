const request = require('../interfaces/request');
class xla {
	get server() {
		return global.config.rpc.server;
	}

	async createWallet(id, password) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"create_wallet",{
			"filename":`${id}`,
			"password":`${password}`,
			"language":"English"
		});

	}

	async openWallet(id, password) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"open_wallet",{
			"filename":`${id}`,
			"password":`${password}`
		});
	}

	async closeWallet(id) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"close_wallet",{});
	}

	async getHeight(id) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"get_height",{});	
	}

	async getAddress(id,idx) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"get_address",{
			"account_index":parseInt(idx || id),
			"address_index":[0]
		});	
	}

	async createSubAddress(id) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"create_account",{
			"label":`${id}`,
		});	
	}
}

module.exports = xla;