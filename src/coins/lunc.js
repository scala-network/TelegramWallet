const { Coins, LCDClient, MnemonicKey, MsgSend, isTxError } = require('@terra-money/terra.js');
const fetch = require('isomorphic-fetch');
const moment = require('moment');
const {bech32} = require('bech32');
class Lunc {
	#_lcd;
	async #_getWallet (wid) {
		const seed = await global.redisClient.lindex('lunc:mnemonic', wid).catch(e => {});
		if(!seed) return null;
		const mk = new MnemonicKey({ mnemonic: Buffer.from(seed, 'base64').toString('utf8') });
		if(!mk) return null;
		return await this.#_lcd.wallet(mk);
	}

	async #_setWallet (seed) {
		await global.redisClient.rpush('lunc:mnemonic', Buffer.from(seed).toString('base64'));
	}

	constructor () {
		this.#_lcd = new LCDClient({
			URL: this.server.address,
			chainID: this.server.chainID,
			isClassic: true
		});
	}

	get server () {
		return global.coins.lunc.rpc;
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
		return parseInt(parseFloat(`${amount}`.replace(',', '')) * this.atomicUnits);
	}

	format (coin) {
		return (parseInt(coin) / this.atomicUnits).toFixed(this.fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + this.symbol;
	}

	explorerLink (hash) {
		return `https://finder.terra.money/classic/${this.server.chainId}/tx/${hash}`;
	}

	async createWallet (id, password) {
		return Promise.reject();
	}

	async validateAddress (id, address) {
		try {
			if (/(terra1[a-z0-9]{38})/g.test(address) === false) return false;
			const { prefix } = bech32.decode(address); // throw error if checksum is invalid
			return prefix === 'terra';
		} catch (e){
			return null;
		}
	}

	async getHeight (id) {
		try {
			const bb = await this.#_lcd.tendermint.blockInfo();
			if (!bb) throw new Error('Unable to get response');
			if (!('block' in bb)) throw new Error('Invalid response block');
			if (!('header' in bb.block)) throw new Error('Invalid response block');
			if (!('height' in bb.block.header)) throw new Error('Invalid response block');

			return {
				height: bb.block.header.height
			};
		} catch (e) {
			return { error: e.message };
		}
	}

	async getAddress (id, walletId) {
		return wallet.key.accAddress;
	}
	static CacheRequest = {};

	async #_getGasPriceCoins () {
		if(!('gasPrices' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.gasPrices = {
				ts:0,
				dt:null
			};
		}

		if(!Lunc.CacheRequest.gasPrices.dt || Lunc.CacheRequest.gasPrices.ts <= moment().format('x')) {
			const gasPrices = await fetch('https://fcd.terra.dev/v1/txs/gas_prices');
			const gasPricesJson = await gasPrices.json();	
			Lunc.CacheRequest.gasPrices.dt = new Coins(gasPricesJson);
			Lunc.CacheRequest.gasPrices.ts = moment().add(1,'day').format('x');
		}
		
		return Lunc.CacheRequest.gasPrices.dt;
		
	}

	async estimateFee (idx, destinations, parse = false) {
		const wallet = await this.#_getWallet(idx);
		if(!wallet) {
			return null;
		}
		let txAmount = 0;
		const send = destinations.map(des => {
			txAmount += des.amount;
			return new MsgSend(
				wallet.key.accAddress,
				des.address,
				{ uluna: des.amount }
				);
		});

		if(!('taxRate' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.taxRate = {
				ts:0,
				dt:null
			};
		}
		if(!('taxCap' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.taxCap = {
				ts:0,
				dt:null
			};
		}
		if(!Lunc.CacheRequest.taxRate.dt || Lunc.CacheRequest.taxRate.ts <= moment().format('x')) {
			let taxRate = await this.#_lcd.treasury.taxRate().catch(e => {});
			if (!taxRate) return {error: "Unable to get tax rate"};
			
			Lunc.CacheRequest.taxRate.dt = taxRate;
			Lunc.CacheRequest.taxRate.ts = moment().add(1,'month').format('x');
		}
		if(!Lunc.CacheRequest.taxCap.dt || Lunc.CacheRequest.taxCap.ts <= moment().format('x')) {
			let taxCap = await this.#_lcd.treasury.taxCap().catch(e => {});
			if (!taxCap || !('amount' in taxCap)) return {error: "Unable to get tax cap"};
			Lunc.CacheRequest.taxCap.dt = taxCap.amount;
			Lunc.CacheRequest.taxCap.ts = moment().add(1,'month').format('x');
		}
		
		const taxAmount = Math.min(Math.ceil(txAmount * parseFloat(Lunc.CacheRequest.taxRate.dt)), parseFloat(Lunc.CacheRequest.taxCap.dt));
		
		const taxAmountCoins = new Coins({uluna:taxAmount});
		const walletInfo = await wallet.accountNumberAndSequence();
		if(!walletInfo)  return {error:"Unable to get wallet info sequence"};

		const signerData = [{ sequenceNumber: walletInfo.sequence }];
		const gasPricesCoins = await this.#_getGasPriceCoins().catch(e => {
			Lunc.CacheRequest.gasPrices = {
				dt:null,
				ds:0
			}
		});
		if(!gasPricesCoins) return {error:"Unable to get gas prices"};
		

		const txFee = await this.#_lcd.tx.estimateFee(signerData, { msgs: send, gasPrices: gasPricesCoins, gasAdjustment: 3, feeDenoms: ['uluna'] }).catch(e => {
			console.log(e);
		});
		if(!txFee) return {error:"Unable to get tx fee"};

		txFee.amount = txFee.amount.add(taxAmountCoins);
		if(parse) {
			return txFee;
		}

		let txfee = txFee.amount.toData(true);
		if (txfee.length > 0) {
			txfee = txfee.filter(bal => {
				if (!('denom' in bal) && !('amount' in bal)) return false;
				if (bal.denom !== 'uluna') return false;
				return true;
			});
			if (txfee.length <= 0) {
				Lunc.CacheRequest.taxCap = {
					ts:0,
					dt:null
				};
				Lunc.CacheRequest.taxRate = {
					ts:0,
					dt:null
				};
				return { error: 'Invalid denom for tax fee' };
			}
			txfee = txfee[0];
			if (!('denom' in txfee) && !('amount' in txfee)) {
				Lunc.CacheRequest.taxCap = {
					ts:0,
					dt:null
				};
				Lunc.CacheRequest.taxRate = {
					ts:0,
					dt:null
				};
				return { error: 'Invalid response for tax fee' };
			}
			txfee = parseInt(txfee.amount);
		} else {
			Lunc.CacheRequest.taxCap = {
				ts:0,
				dt:null
			};
			Lunc.CacheRequest.taxRate = {
				ts:0,
				dt:null
			};
			return { error: 'Unable to get tax fee request' };
		}

		return txfee;
	}

	async getBalance (id, walletId) {
		const wallet = await this.#_getWallet(walletId).catch(e => {});
		if(!wallet) {
			return {error:"Invalid wallet index"};
		}

		const address = wallet.key.accAddress;
		let balance;
		try {
			balance = await this.#_lcd.bank.balance(address);

			if (balance.length <= 1) return { error: 'Invalid response' };
			balance = balance[0].toData(true);
			if (balance.length > 0) {
				balance = balance.filter(bal => {
					if (!('denom' in bal) && !('amount' in bal)) return false;
					if (bal.denom !== 'uluna') return false;
					return true;
				});
				if (balance.length <= 0) return { error: 'Invalid denom' };
				balance = balance[0];
				if (!('denom' in balance) && !('amount' in balance)) return { error: 'Invalid response' };
				balance = parseInt(balance.amount);
			} else {
				balance = 0;
			}

			return { balance };
		} catch (e) {
			return { error: e.message };
		}
	}

	async createSubAddress (id) {
		const mk = new MnemonicKey();
		const wallet = await this.#_lcd.wallet(mk);
		let accountIndex = await global.redisClient.llen('lunc:mnemonic');
		if (!accountIndex) {
			accountIndex = 0;
		}

		const address = wallet.key.accAddress;
		await this.#_setWallet(accountIndex, wallet.key.mnemonic);
		return { account_index: accountIndex, address };
	}

	async transfer (id, idx, address, amount, doNotRelay) {
		return this.transferMany(id, idx, [{ address, amount }], doNotRelay);
	}

	async relay (id, meta) {
		try{
			const data = Buffer.from(meta, 'base64').toString('utf8') 
			const metaParse = JSON.parse(data);
			return this.transferMany(id,metaParse.idx, metaParse.destinations, false);
		}catch(e)
		{
			return {error:"Unable to decode relay transaction"};
		}
	}

	async transferMany (id, idx, destinations, doNotRelay, split = true) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		let totalAmount = 0;
		const wallet = await this.#_getWallet(idx);
		const send = destinations.map(des => {
			totalAmount += des.amount;
			return new MsgSend(
				wallet.key.accAddress,
				des.address,
				{ uluna: des.amount }
				);
		});
		const txFee = await this.estimateFee(idx, destinations, !doNotRelay);	
		if(isNaN(txFee) && 'error' in txFee) {
			return txFee;
		}	
		if (doNotRelay) {

			return {
				fee_list:[txFee],
				amount_list:destinations.map(d => d.amount),
				tx_metadata_list:[Buffer.from(JSON.stringify({destinations,idx})).toString('base64')],
				tx_hash_list:['']
			};
		}
		const tx = await wallet.createAndSignTx({ msgs: send, fee: txFee });
		return new Promise(resolve => {

			this.#_lcd.tx.broadcast(tx).then(result => {
				if (isTxError(result)) {
					Lunc.CacheRequest = {};
					return resolve({ error: result.raw_log });
				}
				resolve({
					fee_list: [txFee.amount],
					amount_list: destinations.map(des => des.amount),
					tx_hash_list: [result.txhash],
				});
			}).catch(e => {
				Lunc.CacheRequest = {};
				if ('response' in e && 'data' in e.response && 'message' in e.response.data) {
					return resolve({ error: e.response.data.message });
				}
				return resolve({ error: e.message });
			});
		});
	}

	async sweep (id, idx, address, doNotRelay, locked = 0) {
		const wallet = await this.#_getWallet(walletId);

		const walletAddress = wallet.key.accAddress;
		let balance;
		try {
			balance = await this.#_lcd.bank.balance(walletAddress);

			if (balance.length <= 1) return { error: 'Invalid response' };
			balance = balance[0].toData(true);
			if (balance.length > 0) {
				balance = balance.filter(bal => {
					if (!('denom' in bal) && !('amount' in bal)) return false;
					if (bal.denom !== 'uluna') return false;
					return true;
				});
				if (balance.length <= 0) return { error: 'Invalid denom' };
				balance = balance[0];
				if (!('denom' in balance) && !('amount' in balance)) return { error: 'Invalid response' };
				balance = parseInt(balance.amount);
			} else {
				return { error: "Unable to get balance" };
			}
			balance-=locked;
			let txFee = this.estimateFee(balance, true);
			const amount = balance - txFee;
			return await this.transferMany(id, idx, [address, amount], doNotRelay);
			
		} catch (e) {
			return { error: e.message };
		}
	}
}

module.exports = Lunc;
