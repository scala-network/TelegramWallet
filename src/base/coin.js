'use strict';

let Coin;

module.exports = () => {
	if(!Coin) {
		const _Coin = require(`../coins/${global.config.coin}`);
		Coin = new _Coin();
	}
	return Coin;
}