const request = require('../interfaces/request');
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
			return null;
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
		return await request.fetch(host,port,id,"get_height",{});	
	}

	async getAddress(id,idx) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"get_address",{
			"account_index":parseInt(idx || id),
			"address_index":[0]
		});	
	}

	async getBalance(id,idx) {
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"get_balance",{
			"account_index":parseInt(idx || id),
			"address_index":[0]
		});

		if(!response) {
			return null;
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async createSubAddress(id) {
		const { host,port} = this.server;
		return await request.fetch(host,port,id,"create_account",{
			"label":`${id}`,
		});	
	}

	async transfer(id, idx, address, amount) {
		const { host,port } = this.server;
		const response = await request.fetch(host,port,id,"transfer",{
			destinations : [{
				address,
				amount
			}],
			ring_size: 3,
			do_not_relay: true,
			get_tx_metadata: true,
			account_index:parseInt(idx || id)
		});

		if(!response) {
			return null;
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async relay(id, meta) {
		const { host,port} = this.server;
		const response = await request.fetch(host,port,id,"relay_tx",{
			"hex":`${meta}`,
		});

		if(!response) {
			return { error: "Unable to get response from rpc" };
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async transferSubmit(id, idx, address, amount) {
		const { host,port } = this.server;
		const response = await request.fetch(host,port,id,"transfer",{
			destinations : [{
				address,
				amount
			}],
			ring_size: 3,
			do_not_relay: false,
			get_tx_metadata: false,
			get_tx_keys: true,
			account_index:parseInt(idx || id)
		});

		if(!response) {
			return null;
		}

		if('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}
}

module.exports = xla;