
class BaseQuery {

	#_properties;

	get properties() {
		return this.#_properties;
	}

	constructor(properties) {
		this.#_properties = properties;
	}
}