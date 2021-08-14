const Model = require('./base');

class Address extends Model
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
		return 'address';
	}
	
	add(id, index, options) {
		return this.Query(options).add(id, index);
	}

	findByUserId(id, options) {
		return this.Query(options).findByUserId(id);
	}
}


module.exports = Address;