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
	
	async getId(user_id, tx_meta, options) {
		return this.Query(options).getId(user_id, tx_meta);
	}

	async findById(user_id, id, options) {
		return this.Query(options).findById(user_id, id);
	}

	async getByUserId(user_id, options) {
		return this.Query(options).getByUserId(user_id);
	}

	async deleteMeta(user_id, id, options) {
		return this.Query(options).deleteMeta(user_id, id);
	}

}


module.exports = Meta;