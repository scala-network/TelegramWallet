const Model = require('../base/model');

class Wallet extends Model
{
	get fields() {
		return [
			"address",
			"balance",
			"user_id",
			"updated",
			"unlocked",
			"status",
			"coin_id",
			"wallet_id",
			"height"
		];
	} 
	
	get className() {
		return 'wallet';
	}
	
	findByUserId(id, options) {
		return this.Query(options).findByUserId(id);
	}
	
	addByUser(user, address, wallet_id, height, options) {
		return this.Query(options).addByUser(user, address, wallet_id, height);
	}

	updateByUserId(user_id, options) {
		return this.Query(options).updateByUserId(user_id);
	}

	update(wallet, options) {
		return this.Query(options).update(wallet);
	}

	async syncBalance(ctx, wallet, coin) {
		let now = Date.now();
		const Network = Model.LoadRegistry('Network');
		const step = now - (global.config.rpc.interval * 1000);
		if(parseInt(wallet.updated) <= step) {
			const result = await coin.getBalance(wallet.user_id, wallet.wallet_id);

			if('error' in result) {
				return ctx.reply(result.error);
			}
			const network = await Network.lastHeight(coin);
			wallet.balance = result.balance;
			wallet.unlock = result.unlocked_balance;
			wallet.height = network.height;
			if(wallet.balance === wallet.unlock) {
				wallet.pending = 0;
			} else {
				wallet.pending = parseInt(result.blocks_to_unlock);
			}
			wallet = await this.update(wallet);
		}

		return wallet;
	}
}


module.exports = Wallet;