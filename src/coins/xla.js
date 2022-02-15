const request = require('../engines/request');
class xla {
	get server() {
		return global.config.rpc.server;
	}

	get symbol() {
		return "XLA";
	}
	
	get atomicUnits() {
		return 100;
	}

	get fractionDigits() {
		return 2;
	}
	
	parse(amount) {
		return parseFloat(`${amount}`) * this.atomicUnits;
	}

	format(coin) {
		return (parseInt(coin) / this.atomicUnits).toFixed(this.fractionDigits) + " " + this.symbol;
	}

	explorerLink(hash) {
		return `https://explorer.scalaproject.io/tx.html?hash=${hash}`;
	}

	async createWallet(id, password) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"create_wallet",{
			"filename":`${id}`,
			"password":`${password}`,
			"language":"English"
		});

	}

	async validateAddress(id, address) {
		const { host,port} = this.server;
		const result = await request.fetch(host,port,id,"validate_address",{
			"address":`${address}`,
		});

		if(!result) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in result) {
			return result.error.message;
		}
		
		return (result.result.valid === true || result.result.valid === 'true');
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
		const response = await request.fetch(host,port,id,"get_height",{});
		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async getAddress(id,wallet_id) {
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"get_address",{
			"account_index":parseInt(wallet_id || id),
			"address_index":[0]
		});	

		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async getBalance(id,wallet_id) {
		if(!wallet_id) {
			return { error: "Missing wallet index" };
		}
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"get_balance",{
			"account_index":parseInt(wallet_id),
			"address_index":[0]
		});

		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async createSubAddress(id) {
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"create_account",{
			"label":`${id}`,
		});	

		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async transfer(id, idx, address, amount, do_not_relay) {
		return await this.transferMany(id, idx, [{address, amount}], do_not_relay);
	}

	async relay(id, meta) {
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"relay_tx",{
			"hex":`${meta}`,
		});

		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async transferMany(id, idx, destinations, do_not_relay) {
		if(!idx) {
			return { error: "Missing wallet index" };
		}
		do_not_relay = do_not_relay || false;

		const { host,port } = this.server;
		const response = await request.fetch(host,port,id,"transfer",{
			destinations,
			ring_size: 11,
			do_not_relay,
			get_tx_metadata: do_not_relay,
			get_tx_keys: !do_not_relay,
			account_index:parseInt(idx)
		});

		if(!response) {
			return { error: "Unable to get a response from RPC" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	
}

module.exports = xla;