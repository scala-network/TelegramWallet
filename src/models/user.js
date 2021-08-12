const Model = require('./base');

class User extends Model
{
	properties = [
		"id",
		"username",
		"selected",
		"status"
	];

	get className() {
		return 'user';
	}

	findWithWalletsById(id, options) {
		return this.Query(options).findWithWalletsById(id);
	}

	createWithWallet(id, username, password, options) {
		return this.Query(options).createWithWallet(id, username, password);
	}

	findWithWalletsAndDaemonHeightById(id, options) {
		return this.Query(options).findWithWalletsAndDaemonHeightById(id);
	}

	findAllWithWalletsById(id, options) {
		return this.Query(options).findAllWithWalletsById(id);
	}
}


module.exports = User;