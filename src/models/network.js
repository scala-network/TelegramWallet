const Model = require('./base');

class Network extends Model
{
	get fields() {
		return [
			"height",
			"timestamp",
		];
	} 
	

	get className() {
		return 'network';
	}

	lastHeight(options) {
		return this.Query(options).lastHeight();
	}

	addHeight(height, options) {
		return this.Query(options).addHeight(height);
	}
}


module.exports = Network;