const Model = require('../base/model');

class User extends Model
{
	get fields() {
		return [
			"user_id",
			"username",
			"status",
			"wallet",
			"wallet_id",
			"coin_id"
		];
	};

	get className() {
		return 'user';
	}

	findById(id, options) {
		return this.Query(options).findById(id);
	}


	exists(id, options) {
		return this.Query(options).exists(id);
	}

	remove(id, username, options) {
		return this.Query(options).remove(id, username);
	}

	add(id,username, options) {
		return this.Query(options).add(id, username);
	}

	findByUsername(username, options) {
		return this.Query(options).findByUsername(username);
	}

	getUsernameById(user_id, options) {
		return this.Query(options).getUsernameById(user_id);
	}
}


module.exports = User;