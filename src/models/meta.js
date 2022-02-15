const Model = require('../base/model');

class Meta extends Model
{

	get fields() {
		return [
			"id",
			"meta",
			"user_id",
			"expired"
		];
	};

	get className() {
		return 'meta';
	}
	
	getId(user_id, tx_meta, options) {
		return this.Query(options).getId(user_id, tx_meta);
	}

	findById(id, user_id, options) {
		return this.Query(options).findById(id, user_id);
	}
}


module.exports = Meta;