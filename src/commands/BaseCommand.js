
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

		const Coin = require(`../coins/${global.config.coin}`);
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
				return ctx.telegram.sendMessage(ctx.from.id,`Authorization failed for command \`${ctx.appRequest.action}\``);
			}
			self.run(c);
		});
	}
}

module.exports = BaseCommand;