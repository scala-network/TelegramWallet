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

}


module.exports = Wallet;