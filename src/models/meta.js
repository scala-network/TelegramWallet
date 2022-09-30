const Model = require('../base/model');

class Meta extends Model {
	get fields () {
		return [
			'id',
			'meta',
			'user_id',
			'expired'
		];
	}

	get className () {
		return 'meta';
	}

	async getId (userId, txMeta, options) {
		return this.Query(options).getId(userId, txMeta);
	}

	async findById (userId, id, options) {
		return this.Query(options).findById(userId, id);
	}

	async getByUserId (userId, options) {
		return this.Query(options).getByUserId(userId);
	}

	async deleteMeta (userId, id, options) {
		return this.Query(options).deleteMeta(userId, id);
	}

}

module.exports = Meta;
