const Model = require('../base/model');

class User extends Model {
	get fields () {
		return [
			'user_id',
			'username',
			'status',
			'wallet',
			'wallet_id',
			'coin_id'
		];
	}

	get className () {
		return 'user';
	}

	findById (id, options) {
		return this.Query(options).findById(id);
	}

	exists (id, options) {
		return this.Query(options).exists(id);
	}

	remove (id, username, options) {
		return this.Query(options).remove(id, username);
	}

	add (id, username, options) {
		return this.Query(options).add(id, username);
	}

	updateUsername (id, username, options) {
		return this.Query(options).updateUsername(id, username);
	}

	findByUsername (username, options) {
		return this.Query(options).findByUsername(username);
	}

	getUsernameById (userId, options) {
		return this.Query(options).getUsernameById(userId);
	}
}

module.exports = User;
