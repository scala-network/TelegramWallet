
class BaseQuery {

	#_fields;

	get fields() {
		return this.#_fields;
	}

	constructor(fields) {
		this.#_fields = fields;
	}
}


module.exports = BaseQuery;