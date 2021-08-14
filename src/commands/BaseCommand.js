
class BaseCommand {
	enabled = false;
	#_coin;
	get Coin() {
		return this.#_coin;
	}

	get description() {
		return false;
	}

	static #_models = {};

	loadModel(model) {
		
		if(!(model in BaseCommand.#_models)) {
			const Model = require(`../models/${model.toLowerCase()}`);
			BaseCommand.#_models[model] = new Model();
		}
		
		return BaseCommand.#_models[model];
	}

	constructor() {

		if(!this.name || !this.description) {
			console.error("Method missing name @ description");
			process.exit();
		}
		
		try{
			this.run({ test: true });
		} catch(e) {
			console.error("Method missing run");
			process.exit();
		}
		
		const Coin = require('../coins/xla');
        this.#_coin = new Coin();

	}
	
	auth(ctx) {
		return true;
	}

	beforeRun(ctx, next) {
		next(ctx);
	}

	exec(ctx) {
		const self = this;
		this.beforeRun(ctx, c => {
			if(!self.auth(c)) {
				return c.reply("Authorization failed for command");
			}
			self.run(c);
		});
	}
}

module.exports = BaseCommand;