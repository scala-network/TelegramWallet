

class BaseModel {
	#_qryObj = {};
	get engine() {
		return "redis";
	}
	
	constructor() {
		if(!this.className) {
			console.error("Missing model's name")
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
			this.#_qryObj[engine] = new classObject();
		}

		return this.#_qryObj[engine];
	}
}


module.exports = BaseModel;