const Model = require('./base');

class Network extends Model
{
	properties = [
		"height",
		"last_sync",
	];

	get className() {
		return 'network';
	}

	async lastHeight(options) {
		return this.Query(options).lastHeight();
	}
}


module.exports = Network;