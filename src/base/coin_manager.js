'use strict'

class CoinManager
{
	static Instance;
	#_coins = {};
	constructor() {
		let coins = global.config.coins;
		for(let coin of coins) {
			const _Coin = require('../coins/'+coin);
			this.#_coins[coin] = new _Coin();
		}
	}
	get(coin) {
		if(coin in this.#_coins) return this.#_coins[coin];
		return null;
	}
}


module.exports = () => {
	if(!CoinManager.Instance) {
		CoinManager.Instance = new CoinManager();
	}

	return CoinManager.Instance;
}