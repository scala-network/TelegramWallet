const logSystem = 'base/Command';

const Model = require('./model');

class Command {
	get enabled() {
		return true;
	}
	
	#_coin;
	get Coin() {
		return this.#_coin;
	}

	get description() {
		return false;
	}

	loadModel(modelName) {
		return Model.LoadRegistry(modelName);
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
		this.beforeRun(ctx, cintex => {
			if(ctx.from.is_bot || !ctx.appRequest.is.action){
				return;
			}
			if(!self.auth(cintex)) {
				if(!cintex.appRequest.is.group) {
					return cintex.telegram.sendMessage(cintex.from.id,`Authorization failed for command \`${cintex.appRequest.action}\``);
				} else {
					return cintex.telegram.sendMessage(cintex.chat.id,`Authorization failed for command \`${cintex.appRequest.action}\``);
				}
			}
			self.run(cintex);
		});
	}
}

module.exports = Command;