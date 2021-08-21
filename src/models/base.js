const logSystem = "model";

class BaseModel {
	#_qryObj = {};

	get engine() {
		return "redis";
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
			const classObject = require(`./queries/${engine}/${this.className}`);
			this.#_qryObj[engine] = new classObject(this.fields);
		}

		return this.#_qryObj[engine];
	}
}


module.exports = BaseModel;