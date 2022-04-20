const request = require('../engines/request');
class xla {
	get server () {
		return global.config.rpc.server;
	}

	get fullname () {
		return 'Scala';
	}

	get symbol () {
		return 'XLA';
	}

	get atomicUnits () {
		return 100;
	}

	get fractionDigits () {
		return 2;
	}

	parse (amount) {
		return parseFloat(`${amount}`.replace(',', '')) * this.atomicUnits;
	}

	format (coin) {
		return (parseInt(coin) / this.atomicUnits).toFixed(this.fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + this.symbol;
	}

	explorerLink (hash) {
		return `https://explorer.scalaproject.io/tx.html?hash=${hash}`;
	}

	async createWallet (id, password) {
		const { host, port } = this.server;
		return await request.fetch(host, port, id, 'create_wallet', {
			filename: `${id}`,
			password: `${password}`,
			language: 'English'
		});
	}

	async validateAddress (id, address) {
		const { host, port } = this.server;
		const result = await request.fetch(host, port, id, 'validate_address', {
			address: `${address}`
		});

		if (!result) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in result) {
			return result.error.message;
		}

		return (result.result.valid === true || result.result.valid === 'true');
	}

	async openWallet (id, password) {
		const { host, port } = this.server;
		return await request.fetch(host, port, id, 'open_wallet', {
			filename: `${id}`,
			password: `${password}`
		});
	}

	async closeWallet (id) {
		const { host, port } = this.server;
		return await request.fetch(host, port, id, 'close_wallet', {});
	}

	async getHeight (id) {
		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'get_height', {});
		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async getAddress (id, walletId) {
		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'get_address', {
			account_index: parseInt(walletId),
			address_index: [0]
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async getBalance (id, walletId) {
		if (!walletId) {
			return { error: 'Missing wallet index' };
		}
		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'get_balance', {
			account_index: parseInt(walletId),
			address_index: [0]
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async createSubAddress (id) {
		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'create_account', {
			label: `${id}`
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async transfer (id, idx, address, amount, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		doNotRelay = doNotRelay || false;

		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'transfer', {
			destinations: [{
				address, amount
			}],
			ring_size: 11,
			mixin: 11,
			priority: 2,
			do_not_relay: doNotRelay,
			get_tx_metadata: doNotRelay,
			get_tx_keys: !doNotRelay,
			account_index: parseInt(idx)
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async relay (id, meta) {
		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'relay_tx', {
			hex: `${meta}`
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async transferMany (id, idx, destinations, doNotRelay, split = true) {
		return (split) ? this.transferSplit(id, idx, destinations, doNotRelay) : this.transfers(id, idx, destinations, doNotRelay);
	}

	async transfers (id, idx, destinations, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		doNotRelay = doNotRelay || false;

		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'transfer', {
			destinations,
			ring_size: 11,
			mixin: 11,
			priority: 2,
			do_not_relay: doNotRelay,
			get_tx_metadata: doNotRelay,
			get_tx_keys: !doNotRelay,
			account_index: parseInt(idx)
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}
		const trx = {
			fee_list: [response.result.fee],
			amount_list: [response.result.amount],
			tx_hash_list: [response.result.tx_hash],
			tx_metadata_list: [response.result.tx_metadata]
		};
		return trx;
	}

	async transferSplit (id, idx, destinations, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		doNotRelay = doNotRelay || false;

		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'transfer_split', {
			destinations,
			ring_size: 11,
			mixin: 11,
			priority: 2,
			do_not_relay: doNotRelay,
			get_tx_metadata: doNotRelay,
			get_tx_keys: !doNotRelay,
			account_index: parseInt(idx)
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}

	async sweep (id, idx, address, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		doNotRelay = doNotRelay || false;

		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'transfer_split', {
			address,
			ring_size: 11,
			mixin: 11,
			priority: 2,
			do_not_relay: doNotRelay,
			get_tx_metadata: doNotRelay,
			get_tx_keys: !doNotRelay,
			account_index: parseInt(idx)
		});

		if (!response) {
			return { error: 'Unable to get a response from RPC' };
		}

		if ('error' in response) {
			return { error: response.error.message };
		}

		return response.result;
	}
}

module.exports = xla;
