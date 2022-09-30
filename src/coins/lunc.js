const { Coins, LCDClient,MnemonicKey,MsgSend, Fee, isTxError } = require('@terra-money/terra.js');
const fetch = require("isomorphic-fetch");

const bech32 = require('bech32');
class lunc {
	#_lcd;
	async #_getWallet(wid){
		const seed = await global.redisClient.lindex('lunc:mnemonic', wid);
		const mk = new MnemonicKey({ mnemonic:Buffer.from(seed, 'base64').toString('utf8')});
		return await this.#_lcd.wallet(mk);
	}

	async #_setWallet(seed){
		await global.redisClient.rpush('lunc:mnemonic', Buffer.from(seed).toString('base64'))
	}


	constructor() {
		this.#_lcd = new LCDClient({
		  URL: this.server.address, // Use "https://lcd.terra.dev" for prod "http://localhost:1317" for localterra.
		  chainID: this.server.chainID, // Use "columbus-5" for production or "localterra".
		  // gasPrices: gasPricesCoins,
		  // gasAdjustment: "1.5", // Increase gas price slightly so transactions go through smoothly.
		  // gas: 10000000,
		  isClassic: true, // false by default, change to true if you want to interact with Terra Classic
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

			return {
				height:bb.block.header.height
			}
		}catch(e) {
			return { error: e.message };
		};
	}

	async getAddress (id, walletId) {

		return wallet.key.accAddress;
	}

	async #_getGasPriceCoins(){
		const gasPrices = await fetch("https://fcd.terra.dev/v1/txs/gas_prices");
		const gasPricesJson = await gasPrices.json();
		console.log(gasPricesJson);
		return new Coins(gasPricesJson);

	}

	async getFee(txAmount) {
		let taxRate= await this.#_lcd.treasury.taxRate().catch(e => {});
		if(!taxRate) taxRate = 0;
		let taxCap = await this.#_lcd.treasury.taxCap().catch(e => {});
		if(!taxCap || !('amount' in taxCap)) {
			taxCap = 10000 * this.atomicUnits;
		}else {
			taxCap = parseFloat(taxCap.amount);
		}
		return Math.min(Math.ceil(txAmount * parseFloat(taxRate)), parseInt(taxCap));
	}

	async getBalance (id, walletId) {
		const wallet = await this.#_getWallet(walletId);

		const address = wallet.key.accAddress;
		let balance;
		try{
			balance = await this.#_lcd.bank.balance(address);

			if(balance.length <= 1) return {error:'Invalid response'};
			balance = balance[0].toData(true);
			if(balance.length > 0) {
				balance = balance.filter(bal => {
					if(!('denom' in bal) && !('amount' in bal)) return false;
					if(bal.denom !== 'uluna') return false;
					return true;
				});
				if(balance.length <= 0) return {error:'Invalid denom'};
				balance = balance[0];
				if(!('denom' in balance) && !('amount' in balance)) return {error:'Invalid response'};
				balance = parseInt(balance.amount);
			} else {
				balance = 0;
			}
			
			return { balance};
		} catch(e) {
			
			return {error:e.message}
		}

	}

	async createSubAddress (id) {
		const mk = new MnemonicKey();
		const wallet = await this.#_lcd.wallet(mk);
		let account_index = await global.redisClient.llen('lunc:mnemonic');
		if(!account_index) {
			account_index = 0;
		}

		const address = wallet.key.accAddress;
		await this.#_setWallet(account_index,wallet.key.mnemonic);
		return {account_index,address};
	}

	async transfer (id, idx, address, amount, doNotRelay) {
		return this.transferMany(id,idx, [{address,amount}], doNotRelay);
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

	async transferMany (id, idx, destinations, doNotRelay, split = true, fee = 0) {
		if (!idx) {
			return { error: 'Missing wallet index' };
		}
		let totalAmount = 0;
		const wallet = await this.#_getWallet(idx);
		const send =  destinations.map(des => {
			totalAmount+=des.amount;
			return new MsgSend(
				wallet.key.accAddress,
				des.address,
				{ uluna: des.amount }
				);
		});
		
		if(!doNotRelay) {
			return;
		}

		const taxAmount = await this.getFee(totalAmount);
		// Compute the burn tax amount for this transaction and convert to Coins
		const taxAmountCoins = new Coins({ uluna : taxAmount });
		console.log("Burn tax amount: ", taxAmountCoins);
		const walletInfo = await wallet.accountNumberAndSequence();
		const signerData = [{ sequenceNumber: walletInfo.sequence }];
		const gasPricesCoins = await this.#_getGasPriceCoins();
		// Estimate the gas amount and fee (without burn tax) for the message
		var txFee = await this.#_lcd.tx.estimateFee(signerData,{ msgs: send, gasPrices: gasPricesCoins, gasAdjustment: 3 });
		console.log("Gas and Fee estimate, pre-tax:", txFee.amount)

		// Add the burn tax component to the estimated fee
		txFee.amount = txFee.amount.add(taxAmountCoins);
		console.log("Gas and Fee estimate, post tax:", txFee.amount);

		const tx = await wallet.createAndSignTx({ msgs: send, fee: txFee });
		// let tx = await wallet.createAndSignTx({ msgs:send,gasPrices:{uluna:fee}});
		return new Promise(resolve => {
			this.#_lcd.tx.broadcast(tx).then(result => {
				if (isTxError(result)) {
					return resolve({error:result.raw_log});
				}

				resolve({
					fee_list : [txFee.amount],
					amount_list : destinations.map(des => des.amount),
					tx_hash_list : [result.txhash]
				});
			}).catch(e => {
				if('response' in e && 'data' in e.response && 'message' in e.response.data) {
					return resolve({error:e.response.data.message});
				}
				return resolve({error:e.message});
			})

		})

}

async sweep (id, idx, address, doNotRelay) {
	return { error: 'Unable to get a response from RPC' };
}
}

module.exports = lunc;
