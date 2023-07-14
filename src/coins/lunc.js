const { Coins, LCDClient, MnemonicKey, MsgSend, isTxError } = require('@terra-money/terra.js');
const fetch = require('isomorphic-fetch');
const moment = require('moment');
const { bech32 } = require('bech32');
const system = 'coins/lunc';
class Lunc {
	#_lcd;
	async #_getWallet (wid) {
		const seed = await global.redisClient.lindex('lunc:mnemonic', wid).catch(e => {});
		if (!seed) return null;
		const mk = new MnemonicKey({ mnemonic: Buffer.from(seed, 'base64').toString('utf8') });
		if (!mk) return null;
		return await this.#_lcd.wallet(mk);
	}

	async #_setWallet (id, seed) {
		await global.redisClient.rpush('lunc:mnemonic', Buffer.from(seed).toString('base64'));
	}

	get cmcName () {
		return 'terra-luna';
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
		const coinvalue = '' + (parseInt(coin) / this.atomicUnits).toFixed(this.fractionDigits);
		const numerous = coinvalue.split('.');
		return `${numerous[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${numerous[1]} ${this.symbol}`;
	}

	explorerLink (hash) {
		return `https://finder.terra.money/classic/tx/${hash}`;
	}

	async createWallet (id, password) {
		return Promise.reject(new Error('Coin does not have create wallet function'));
	}

	async validateAddress (id, address) {
		try {
			if (/(terra1[a-z0-9]{38})/g.test(address) === false) return false;
			const { prefix } = bech32.decode(address); // throw error if checksum is invalid
			return prefix === 'terra';
		} catch (e) {
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
		const wallet = await this.#_getWallet(walletId).catch(e => global.log('error', system, 'Unable to get wallet'));
		if (!wallet) {
			return null;
		}
		return wallet.key.accAddress;
	}

	static CacheRequest = {};

	async #_getGasPriceCoins () {
		if (!('gasPrices' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.gasPrices = {
				ts: 0,
				dt: null
			};
		}

		if (!Lunc.CacheRequest.gasPrices.dt || Lunc.CacheRequest.gasPrices.ts <= moment().format('x')) {
			const gasPrices = await fetch('https://fcd.terra.dev/v1/txs/gas_prices');
			const gasPricesJson = await gasPrices.json();
			Lunc.CacheRequest.gasPrices.dt = new Coins(gasPricesJson);
			Lunc.CacheRequest.gasPrices.ts = moment().add(1, 'week').format('x');
		}

		return Lunc.CacheRequest.gasPrices.dt;
	}

	#_destinationsFilter (wallet, destinations) {
		let send;
		let txAmount = 0;
		if (Array.isArray(destinations)) {
			send = destinations.map(des => {
				txAmount += des.amount;
				return new MsgSend(
					wallet.key.accAddress,
					des.address,
					{ uluna: des.amount.toString() }
				);
			});
		} else if (typeof destinations === 'object') {
			send = [new MsgSend(wallet.key.accAddress, wallet.key.accAddress, { uluna: destinations.amount })];
		} else {
			send = [new MsgSend(wallet.key.accAddress, wallet.key.accAddress, { uluna: destinations })];
		}

		return { send, txAmount };
	}

	async #_taxes () {
		if (!('taxRate' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.taxRate = {
				ts: 0,
				dt: null
			};
		}
		if (!('taxCap' in Lunc.CacheRequest)) {
			Lunc.CacheRequest.taxCap = {
				ts: 0,
				dt: null
			};
		}
		if (!Lunc.CacheRequest.taxRate.dt || Lunc.CacheRequest.taxRate.ts <= moment().format('x')) {
			const taxRate = await this.#_lcd.treasury.taxRate().catch(e => {});
			if (!taxRate) return { error: 'Unable to get tax rate' };

			Lunc.CacheRequest.taxRate.dt = taxRate;
			Lunc.CacheRequest.taxRate.ts = moment().add(1, 'month').format('x');
		}
		if (!Lunc.CacheRequest.taxCap.dt || Lunc.CacheRequest.taxCap.ts <= moment().format('x')) {
			const taxCap = await this.#_lcd.treasury.taxCap().catch(e => {});
			if (!taxCap || !('amount' in taxCap)) return { error: 'Unable to get tax cap' };
			Lunc.CacheRequest.taxCap.dt = taxCap.amount;
			Lunc.CacheRequest.taxCap.ts = moment().add(1, 'month').format('x');
		}

		return {
			taxRate: Lunc.CacheRequest.taxRate.dt,
			taxCap: Lunc.CacheRequest.taxCap.dt
		};
	}
	
	#_gasAdjustment = 4;

	async #_estimateFee (idx, destinations, wallet) {
		if (!wallet) {
			wallet = await this.#_getWallet(idx);
			if (!wallet) {
				return null;
			}
		}

		const { send, txAmount } = this.#_destinationsFilter(wallet, destinations);
		const { taxRate, taxCap } = await this.#_taxes();
		const taxAmount = Math.min(Math.ceil(txAmount * parseFloat(taxRate)), parseFloat(taxCap));

		const taxAmountCoins = new Coins({ uluna: taxAmount });
		const walletInfo = await wallet.accountNumberAndSequence().catch(e => {
			global.log('error', system, 'Unable to get wallet info sequence');
		});
		if (!walletInfo) return { error: 'Unable to get wallet info sequence' };

		const signerData = [{ sequenceNumber: walletInfo.sequence }];
		const gasPricesCoins = await this.#_getGasPriceCoins();

		if (!gasPricesCoins) return { error: 'Unable to get gas prices' };

		const txFee = await this.#_lcd.tx.estimateFee(signerData, {
		 msgs: send, gasPrices: gasPricesCoins, gasAdjustment: this.#_gasAdjustment, feeDenoms: ['uluna'] 
		}).catch(e => {
			global.log('error', system, 'Error estimate fee %s', [e.message]);
		});
		if (!txFee) return { error: 'Unable to get tx fee' };

		txFee.amount = txFee.amount.add(taxAmountCoins);

		return txFee;
	}

	async estimateFee (idx, destinations, retAmtObject = false) {
		const wallet = await this.#_getWallet(idx);
		if (!wallet) {
			return null;
		}
		const txFee = await this.#_estimateFee(idx, destinations, wallet).catch(e => {
			global.log('error', system, 'RPC Estimate Fee : %s', [e.message]);
		});
		if (!txFee) return null;
		if ('error' in txFee) return txFee;

		if (retAmtObject) return txFee;
		return this.#_txFeeToAmt(txFee);
	}

	#_txFeeToAmt (txFee) {
		let txfee;
		try {
			txfee = txFee.toData(true);
		} catch {
			return { error: 'Error converting toData txFee : ' + txFee };
			return txFee;
		}
		// console.log("We got the txFee " , txFee);
		if (!Array.isArray(txFee.amount)) {
			txfee = txFee.amount._coins.uluna.amount;
		} else if (txfee.length > 0) {
			txfee = txfee.filter(bal => {
				if (!('denom' in bal) && !('amount' in bal)) return false;
				if (bal.denom !== 'uluna') return false;
				return true;
			});
			if (txfee.length <= 0) {
				Lunc.CacheRequest.taxCap = {
					ts: 0,
					dt: null
				};
				Lunc.CacheRequest.taxRate = {
					ts: 0,
					dt: null
				};
				return { error: 'Invalid denom for tax fee' };
			}
			txfee = txfee[0];
			if (!('denom' in txfee) && !('amount' in txfee)) {
				Lunc.CacheRequest.taxCap = {
					ts: 0,
					dt: null
				};
				Lunc.CacheRequest.taxRate = {
					ts: 0,
					dt: null
				};
				return { error: 'Invalid response for tax fee' };
			}
			txfee = parseInt(txfee.amount);
		} else {
			Lunc.CacheRequest.taxCap = {
				ts: 0,
				dt: null
			};
			Lunc.CacheRequest.taxRate = {
				ts: 0,
				dt: null
			};
			return { error: 'Unable to get tax fee request' };
		}

		return txfee;
	}

	async #_getBalance (wallet) {
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

	async getBalance (id, walletId) {
		const wallet = await this.#_getWallet(walletId).catch(e => { console.log(e); });
		if (!wallet) {
			return { error: 'Invalid wallet index ' + walletId };
		}

		return await this.#_getBalance(wallet);
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

	async transfer (id, idx, address, amount, options = {}) {
		return await this.transferMany(id, idx, [{ address, amount }], options);
	}

	async relay (id, meta) {
		try {
			const data = Buffer.from(meta, 'base64').toString('utf8');
			const metaParse = JSON.parse(data);
			const idx = metaParse.idx;
			if (typeof idx === 'undefined' || isNaN(idx) || idx === false) {
				return { error: 'Relay missing wallet index' };
			}

			const wallet = await this.#_getWallet(idx);

			if (!wallet) return { error: 'Missing wallet' };
			let options = {};
			if ('options' in metaParse) {
				options = metaParse.options;
			}
			options.doNotRelay = false;
			if (!('sweep_all' in metaParse)) return await this.#_transfers(id, idx, metaParse.destinations, options, wallet);

			return await this.sweep(id, idx, metaParse.address, options);
		} catch	{

		}
	}

	async #_transfers (id, idx, destinations, options = {}, wallet = null) {
		if (typeof idx === 'undefined' || isNaN(idx) || idx === false) {
			return { error: 'Missing wallet index' };
		}

		if (!wallet) {
			wallet = await this.#_getWallet(idx).catch(e => {
				global.log('error', system, 'Unable to get wallet %s', [e.message]);
			});
			if (!wallet) {
				return { error: 'Missing wallet' };
			}
		}
		if (!('doNotRelay' in options)) {
			options.doNotRelay = false;
		}
		const { send } = this.#_destinationsFilter(wallet, destinations);
		const txFee = await this.estimateFee(idx, destinations, !options.doNotRelay);
		if (isNaN(txFee) && 'error' in txFee) {
			return txFee;
		}
		if (options.doNotRelay) {
			return {
				fee_list: [txFee],
				amount_list: destinations.map(d => d.amount),
				tx_metadata_list: [Buffer.from(JSON.stringify({ destinations, idx, options })).toString('base64')],
				tx_hash_list: ['']
			};
		}
		let memo = '';
		if ('memo' in options) {
			memo = options.memo;
		}
		const tx = await wallet.createAndSignTx({ msgs: send, memo, fee: txFee }).catch(e => {
			global.log('error', system, 'LUNC createAndSignTx %s', [e.message]);
		});
		if (!tx) {
			return { error: 'TX error' };
		}
		return new Promise(resolve => {
			this.#_lcd.tx.broadcast(tx).then(result => {
				if (isTxError(result)) {
					Lunc.CacheRequest = {};
					return resolve({ error: result.raw_log });
				}
				resolve({
					fee_list: [txFee.amount],
					amount_list: destinations.map(des => des.amount),
					tx_hash_list: [result.txhash]
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

	async transferMany (id, idx, destinations, options = {}) {
		return await this.#_transfers(id, idx, destinations, options);
	}

	async sweep (id, idx, address, options = {}) {
		if (typeof idx === 'undefined' || isNaN(idx) || idx === false) {
			return { error: 'Missing wallet index' };
		}
		const wallet = await this.#_getWallet(idx);
		if (!wallet) {
			return { error: 'Missing wallet' };
		}
		if (!('doNotRelay' in options)) {
			options.doNotRelay = false;
		}
		// Obtain the signing wallet data
		const walletInfo = await wallet.accountNumberAndSequence().catch(e => {
			global.log('error', system, 'LUNC Sweep > accountNumberAndSequence %s', [e.message]);
		});
		if (!walletInfo) {
			return { error: 'Error getting account number and sequence' };
		}
		const signerData = [{ sequenceNumber: walletInfo.sequence }];
		let balance = await this.#_getBalance(wallet).catch(e => {
			global.log('error', system, 'LUNC Sweep > getBalance %s', [e.message]);
		});
		if ('error' in balance) return balance;
		balance = balance.balance;

		// Populate the dummy send message
		const dmsg = new MsgSend(wallet.key.accAddress, address, { uluna: balance.toString() });

		// Estimate the gas amount and fee (without burn tax) for the message
		const gasPrices = await this.#_getGasPriceCoins().catch(e => {
			global.log('error', system, 'LUNC Sweep > getGasPriceCoins %s', [e.message]);
		});
		const txFee = await this.#_lcd.tx.estimateFee(
			signerData,
			{
				msgs: [dmsg],
				gasPrices,
				gasAdjustment:this.#_gasAdjustment,
				feeDenoms: ['uluna']
			}
		);

		const feeGas = this.#_txFeeToAmt(txFee);
		const taxes = await this.#_taxes();
		if ('error' in taxes) return taxes;
		const { taxRate, taxCap } = taxes;

		const txAmount = Math.floor((parseInt(balance) - parseInt(feeGas)) / (1 + parseInt(taxRate)));

		const taxAmount = Math.min(Math.ceil(txAmount * parseFloat(taxRate)), parseFloat(taxCap));
		const taxAmountCoins = new Coins({ uluna: taxAmount });
		txFee.amount = txFee.amount.add(taxAmountCoins);
		const txfff = this.#_txFeeToAmt(txFee);
		const destinations = [new MsgSend(wallet.key.accAddress, address, { uluna: Math.floor(txAmount * 0.988).toString() })];
		if (options.doNotRelay) {
			return {
				fee_list: [txfff],
				amount_list: destinations.map(d => d.amount),
				tx_metadata_list: [Buffer.from(JSON.stringify({ idx, sweep_all: true, address, options })).toString('base64')],
				tx_hash_list: ['']
			};
		}
		let memo = '';
		if ('memo' in options) {
			memo = options.memo;
		}

		const tx = await wallet.createAndSignTx({ msgs: destinations, fee: txFee, memo }).catch(e => {
			global.log('error', system, 'LUNC Sweep > createAndSignTx %s', [e.message]);
		});
		if (!tx) {
			return { error: 'TX error' };
		}
		
		return new Promise(resolve => {
			this.#_lcd.tx.broadcast(tx).then(result => {
				if (isTxError(result)) {
					Lunc.CacheRequest = {};
					return resolve({ error: result.raw_log });
				}
				resolve({
					fee_list: [txFee.amount],
					amount_list: destinations.map(des => des.amount),
					tx_hash_list: [result.txhash]
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
}

module.exports = Lunc;
