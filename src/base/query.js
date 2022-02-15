const logSystem = 'base/query';

class Query {

	#_fields;

	get fields() {
		return this.#_fields;
	}

	constructor(fields) {
		this.#_fields = fields;
	}
}


module.exports = Query;