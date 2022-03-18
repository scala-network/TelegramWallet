'use strict';
const Model = require('./base/model');
const Market = Model.LoadRegistry('Market');
const https = require('https');
const logSystem = "Worker";
const sleep = async (timer = 1) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve,timer * 1000);
	});
};
class CoinMarketCap {
	fetchInterval;
	apiKey;
	cmcEndPoint;
	convertTo;
	cmcId;
	// CMC have a limit of 333 calls per day
	// So we should do interval every 5 minutes
	// Allowed calls per day >= Hours per day * mins per hours / mins
	// 333 >= 24 hours x (60mins per hour / 5mins)
	// 333 >= 288 calls per day
	// But now we have these quotes
	// EURO, BTC, LTC, USD
	// 1 quote equals to 1 call. Equals to 4 calls per transactions
	// So we reverse our formula as below
	// Expected Minute = (Number of calls per transaction * Hours per day * mins per hours) / 333
	// Interval In Minute = ( 4 x 24 x 60 ) / 333
	// = 17.2972972973 minutes
	// If we take 18 minutes as expected interval (1080 seconds)
	// 333 >= 320
	constructor (cfg = {}) {
		let tickers = cfg.tickers;
		tickers = Array.isArray(tickers) ? tickers : [tickers];
		if (tickers.length < 0) {
			global.log('error', 'No tickets avaliable')
			process.exit();
			return;
		}
		this.config = cfg;
		let isSandBox = 'isSandBox' in cfg ? cfg.isSandBox : false;
		this.apiKey = 'apiKey' in cfg && !isSandBox ? cfg.apiKey : 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c';
		if (this.apiKey === 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c')  isSandBox = true;
		this.cmcId = 'cmcId' in cfg ? cfg.cmcId : '2629';
		this.cmcEndPoint = isSandBox ? 'sandbox-api.coinmarketcap.com' : 'pro-api.coinmarketcap.com';
		this.tickers = tickers;
		this.fetchInterval = Math.ceil(this.tickers.length * 96 / 333) * 60000;
	}

	async getQuotes (ticker) {
		const cmcId  = this.cmcId;
		return await new Promise((resolve, reject) => {
			const options = {
				hostname: this.cmcEndPoint,
				port: 443,
				path: '/v2/cryptocurrency/quotes/latest?id=' + cmcId,
				method: 'GET',
				headers: {
					'X-CMC_PRO_API_KEY': this.apiKey
				}
			};

			const req = https.request(options, res => {
				res.on('data', d => {
					let dbuff;
					if (typeof d === 'string') {
						dbuff = d;
					} else {
						dbuff = Buffer.from(d).toString();
					}
					let response;
					try {
						response = JSON.parse(dbuff);
					} catch (e) {
						return reject(new Error(e.message));
					}
					if (!response) return reject(new Error('No response'));
					if (response.status && response.status.error_message) return reject(new Error(response.status.error_message));
					const json = response.data;
					if (!(cmcId in json)) return reject(new Error('Unable to get base on cmc id ' + cmcId));
					if (!('quote' in json[cmcId])) return reject(new Error('Unable to get quote for cmc id ' + cmcId));
					if (!(ticker in json[cmcId].quote)) return reject(new Error('Unable to get ticker ' + ticker + ' for cmc id ' + cmcId));
					const data = json[cmcId].quote[ticker];
					if (!data) return reject(new Error('No data for cmc id ' + cmcId));
					resolve(data);
				});
			});

			req.on('error', error => reject(error));

			req.end();
		});
	}


	async fetch () {
		const now = Date.now();
		const symbol = global.config.coin;
		const lastUpdated = await Market.getLastUpdated(global.config.coin)
			.catch(e => global.log('error', 'Error : ' + e.message));

		if (lastUpdated && ((now - lastUpdated) < this.fetchInterval)) return;
		
		const dataStored = {};
		for (const ticker of this.tickers) {
			const data = await this.getQuotes(ticker)
				.catch(e => global.log('error',logSystem, 'Error : ' + e.message));
			if (data) dataStored[ticker] = data;
			await sleep();
		}
		if (Object.keys(dataStored).length <= 0) return;
		await await Market.update(symbol, dataStored)
			.catch(e => global.log('error',logSystem, 'Error : ' + e.message));
	}
}
/** Store data from CMC **/
if('market' in global.config && 'tickers' in global.config.market) {
	const cmc = new CoinMarketCap(global.config.market);
	(async() => {
		await cmc.fetch();
		await sleep(cmc.fetchInterval/1000);
	})();

}

const clearOldStats = async () => {
	const dateObj = new Date();
	dateObj.setDate(dateObj.getDate() - 1);
    const month = String(dateObj.getMonth()).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
	const ydk = parseInt(year + month + day);
	let cursor = false;
	const todelete = [];
	while(cursor !== 0){
		let groupNimbuses = await global.redisClient.scan(cursor !== false ? cursor : 0,'match',global.config.coin + ':GroupNimbus:*', 'count', 100);
		for(let groupNimbus of groupNimbuses[1]) {
			if(!groupNimbus) continue;
			const parts = groupNimbus.split(':');
			const nimbus = parts[parts.length -2];
			if(nimbus === 'overall') continue;
			const inum = parseInt(nimbus);
			if(inum > ydk) continue;
			todelete.push(groupNimbus);
		}
		cursor = parseInt(groupNimbuses[0]);
		sleep(0.5);
	}


	cursor = false;
	while(cursor !== 0){
		let groupWettest = await global.redisClient.scan(cursor !== false ? cursor : 0,'match',global.config.coin + ':GroupWettest:*', 'count', 100);
		for(let groupWet of groupWettest[1]) {
			if(!groupWet) continue;
			const parts = groupWet.split(':');
			const wet = parts[parts.length -2];
			if(wet === 'overall') continue;
			const inum = parseInt(wet);
			if(inum > ydk) continue;
			todelete.push(groupWet);

		}
				
		cursor = parseInt(groupWettest[0]);
		sleep(0.5);
	}
	if(todelete.length > 0){
		global.log('info', logSystem, "Clearing old stats %d", [todelete.length]);
		await global.redisClient.del(todelete);
	} else {
		global.log('info', logSystem, "No stats to be deleted");
	}
};
/** Clear previous wet and nimbus **/
(async() => {
	while(true) {
		await clearOldStats().catch(e => global.log('error', e.message));
		await sleep(86400);
	}
})();
