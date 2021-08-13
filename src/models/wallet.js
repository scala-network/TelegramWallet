const Model = require('./base');

class Wallet extends Model
{
	properties = [
		"user_id",
		"address",
		"last_sync",
		"height",
		"balance",
		"unlocked",
		"status"
	];


	get className() {
		return 'wallet';
	}

	async addWalletByUserId(id, address, options) {
		return this.Query(options).addWalletByUserId(id, username, password);
	}
}


module.exports = Wallet;