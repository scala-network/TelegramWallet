const Model = require('../base/model');
const logSystem = "model/address";

class Address extends Model
{

	get fields() {
		return [
			'address',
			'user_id',
			'coin_id'
		];
	};

	get className() {
		return 'address';
	}
	
	add(data, options) {
		return this.Query(options).add(data);
	}

	findByUserId(id, options) {
		return this.Query(options).findByUserId(id);
	}
}


module.exports = Address;