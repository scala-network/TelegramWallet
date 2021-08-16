const Model = require('./base');

class User extends Model
{
	properties = [
		"id",
		"username",
		"status",
		"wallet",
		"wallet_id",
	];

	get className() {
		return 'user';
	}

	findAllById(id, options) {
		return this.Query(options).findAllById(id);
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
}


module.exports = User;