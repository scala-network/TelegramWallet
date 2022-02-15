const logSystem = "base/model";

class Model {

	static Registries = {};
	static LoadRegistry(registry) {
		registry = registry.toLowerCase();
		if(registry in Model.Registries) {
			return Model.Registries[registry];
		}

		const model = require(`../models/${registry}`);
		const registerModel = new model();
		Model.Registries[registry] = registerModel;
		return registerModel;
	}

	#_qryObj = {};

	get engine() {
		return global.config.datasource.engine;
	}
	
	get fields() {
		return [];
	}

	constructor() {
		if(!this.className) {
			console.error("Missing model's name")
			process.exit();
		}

		if(!this.fields || this.fields.length <= 0) {
			global.log('error',logSystem,'Missing  model\'s properties',[this.className]);
			process.exit();
		}
	}

	Query(options) {
		let engine = this.engine;

		if(options && (options.constructor === Object) ){
			if('engine' in options) {
				engine =  options.engine;
			}
		}

		if(!(engine in this.#_qryObj)) {
			const classObject = require(`../models/queries/${engine}/${this.className}`);
			this.#_qryObj[engine] = new classObject(this.fields);
		}

		return this.#_qryObj[engine];
	}
}


module.exports = Model;