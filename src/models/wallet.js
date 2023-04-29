'use strict';

const Model = require('../base/model');

class Wallet extends Model {
	get fields () {
		return [
			'address',
			'balance',
			'user_id',
			'updated',
			'unlocked',
			'status',
			'coin_id',
			'wallet_id',
			'height'
		];
	}

	get className () {
		return 'wallet';
	}

	findByUserId (id, coins, options) {
		return this.Query(options).findByUserId(id, coins);
	}

	addByUser (user, address, walletId, height, coin, options) {
		return this.Query(options).addByUser(user, address, walletId, height, coin);
	}

	updateByUserId (userId, options) {
		return this.Query(options).updateByUserId(userId);
	}

	update (userId, wallet, options) {
		return this.Query(options).update(userId, wallet);
	}

	async syncBalance (userId, wallet, coin) {
		const now = Date.now();
		const Network = Model.LoadRegistry('Network');
		const step = now - (global.config.rpc.interval * 1000);
		if (!wallet) return wallet;
		if (!('updated' in wallet) || parseInt(wallet.updated) <= step) {
			const result = await coin.getBalance(userId, wallet.wallet_id);

			if (!result) {
				return { error: 'Unable to connect with rpc. Please try again later' };
			}
			if ('error' in result) {
				return result;
			}
			wallet.balance = result.balance;
			if ('unlocked_balance' in result) wallet.unlock = result.unlocked_balance;
			const { height } = await Network.lastHeight(coin);
			wallet.height = height;
			if ('pending' in wallet) wallet.pending = parseInt(result.blocks_to_unlock);
			// wallet.balance === wallet.unlock;
			wallet = await this.update(userId, wallet);
		}

		return wallet;
	}
}

module.exports = Wallet;
