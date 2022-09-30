'use strict';

const logSystem = 'base/model';

class Model {
	static Registries = {};
	static LoadRegistry (registry) {
		registry = registry.toLowerCase();
		if (registry in Model.Registries) {
			return Model.Registries[registry];
		}

		const RegisterModel = require(`../models/${registry}`);
		const registerModel = new RegisterModel();
		Model.Registries[registry] = registerModel;
		return registerModel;
	}

	#_qryObj = {};

	get engine () {
		return 'redis';
	}

	get fields () {
		return [];
	}

	constructor () {
		if (!this.className) {
			console.error("Missing model's name");
			process.exit();
		}

		if (!this.fields || this.fields.length <= 0) {
			global.log('error', logSystem, 'Missing  model\'s properties', [this.className]);
			process.exit();
		}
	}

	Query (options = []) {
		let engine = this.engine;

		if (options && (options.constructor === Object) && options.engine) {
			engine = options.engine;
		}

		if (!(engine in this.#_qryObj)) {
			const ClassObject = require(`../models/queries/${engine}/${this.className}`);
			this.#_qryObj[engine] = new ClassObject(this.fields);
		}

		return this.#_qryObj[engine];
	}
}

module.exports = Model;
