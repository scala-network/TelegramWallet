const { Coins, LCDClient,MnemonicKey,MsgSend } = require('@terra-money/terra.js');
const bech32 = require('bech32');
class lunc {
	#_lcd;
	async #_getWallet(wid){
		const seed = await global.redisClient.hget('lunc:storages', wid);
		const mk = new MnemonicKey({ mnemonic:Buffer.from(seed, 'base64').toString('utf8')});
		return await this.#_lcd.wallet(mk);
	}

	async #_setWallet(wid, seed){
		global.redisClient.incrby('lunc:rno',1);
		return await global.redisClient.hset('lunc:storages', wid, Buffer.from(seed).toString('base64'));
	}


	constructor() {
		this.#_lcd = new LCDClient({
		  URL: this.server.rpc.address, // Use "https://lcd.terra.dev" for prod "http://localhost:1317" for localterra.
		  chainID: this.server.rpc.chainID, // Use "columbus-5" for production or "localterra".
		  // gasPrices: gasPricesCoins,
		  // gasAdjustment: "1.5", // Increase gas price slightly so transactions go through smoothly.
		  // gas: 10000000,
		  isClassic: true, // false by default, change to true if you want to interact with Terra Classic
		});
	}

	get server () {
		return global.config.lunc.rpc;
	}

	get fullname () {
		return 'Luna Classic';
	}

	get symbol () {
		return 'LUNC';
	}

	get atomicUnits () {
		return 1000000;
	}

	get fractionDigits () {
		return 6;
	}

	parse (amount) {
		return parseFloat(`${amount}`.replace(',', '')) * this.atomicUnits;
	}

	format (coin) {
		return (parseInt(coin) / this.atomicUnits).toFixed(this.fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + this.symbol;
	}

	explorerLink (hash) {
		return `https://finder.terra.money/${this.server.chainId}/tx/${hash}`;
	}

	async createWallet (id, password) {
		return Promise.reject();
	}

	async validateAddress (id, address) {
		try {
			const { prefix: decodedPrefix } = bech32.decode(address); // throw error if checksum is invalid
			// verify address prefix
			return decodedPrefix === "terra";
		} catch {
			// invalid checksum
			return false;
		}
	}
	
	async getHeight (id) {
		try{
			
			const bb = await this.#_lcd.tendermint.blockInfo();
			if(!bb) throw new Error("Unable to get response");
			if(!('block' in bb)) throw new Error("Invalid response block");
			if(!('header' in bb.block)) throw new Error("Invalid response block");
			if(!('height' in bb.block.header)) throw new Error("Invalid response block");
			return bb.block.header.height;
		}catch(e => {
			return { error: e.message };
		});
	}

	async getAddress (id, walletId) {

		return wallet.key.accAddress;
	}

	async getBalance (id, walletId) {
		const wallet = await this.#_getWallet(walletId);

		const address = wallet.key.accAddress;
		let balance;
		try{
			balance = await lcd.bank.balance(address);
		} catch(e) {
			console.log(e.code);
		}

		console.log(balance[0].toData(true));

	}

	async createSubAddress (id) {
		const mk = new MnemonicKey();
		const wallet = await this.#_lcd.wallet(mk);
		const rno = await global.redisClient.get('lunc:rno');
		if(!rno) {
			rno = 1;
		}

		const address = wallet.key.accAddress;
		await this.#_setWallet(rno,wallet.key.mnemonic);
		return address;
	}

	async transfer (id, idx, address, amount, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		const wallet = await this.#_getWallet(idx);
		let send;
		if(doNotRelay) {
			send = new MsgSend(wallet.key.accAddress,address,{ uluna: amount });
			const unsignedTx = await wallet.createTx({[send]});

		} else {
			send = new MsgSend(
				wallet.key.accAddress,
				address,
				{ uluna: amount }
				);
		}

		const tx = await wallet.createAndSignTx({ msgs: [send] });
		const result = await lcd.tx.broadcast(tx);
	}

	async relay (id, meta) {
		const tx = wallet.key.signTx(meta);
		const result = await lcd.tx.broadcast(tx);


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

	async sweep (id, idx, address, doNotRelay) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		doNotRelay = doNotRelay || false;

		const { host, port } = this.server;
		const response = await request.fetch(host, port, id, 'sweep_all', {
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

module.exports = lunc;
