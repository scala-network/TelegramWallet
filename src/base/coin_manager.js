'use strict'

class CoinManager
{
	static Instance;
	#_coins = {};
	constructor() {
		let coins = global.config.coins;
		for(let coin of coins) {
			const _Coin = require('../coins/'+coin.toLowerCase());
			this.#_coins[coin] = new _Coin();
		}
	}
	get(coin) {
		if(coin.toLowerCase() in this.#_coins) return this.#_coins[coin.toLowerCase()];
		return null;
	}
}


module.exports = () => {
	if(!CoinManager.Instance) {
		CoinManager.Instance = new CoinManager();
	}

	return CoinManager.Instance;
}