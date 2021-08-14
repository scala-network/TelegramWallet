const Model = require('./base');

class Wallet extends Model
{
	properties = [
		"id",
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
	
	findByUserId(id, options) {
		return this.Query(options).findByUserId(id);
	}
	
	addByUser(user, address, options) {
		return this.Query(options).addByUser(user, address, options);
	}
}


module.exports = Wallet;