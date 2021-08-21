const logSystem = 'registry/registries';

class Registeries
{
	#_registers = {};

	get allowed() {
		return global.config.commands.allowed;
	}

	get registerName() {
		return false;
	}

	constructor(bot) {
		const allowRegister = this.allowed;

		for(let i =0; i < allowRegister.length;i++) {
					
			let c = allowRegister[i];
			let o;
			if(c in this.#_registers) {
				o = this.#_registers[c];
			} else {
				const cc = require(`../${this.registerName.toLowerCase()}/${c}${this.registerName}.js`);
				o = new cc();
			}
			if(!o.enabled) {
				continue;
			}
			this.#_registers[c] = o;
		}
	}

	getRegisters() {
		return this.#_registers;
	}
	
	getRegister(cmd) {
		if(cmd in this.#_registers) {
			return this.#_registers[cmd]; 
		}

		return false;
	}

	setBot(bot) {
		const allowCommands = Object.keys(this.getRegisters());
		const self = this;
		for(let i =0; i < allowCommands.length;i++) {
					
			let c = allowCommands[i];
			const cmd = self.getRegister(c);

			if(!cmd || !cmd.enabled) return;
			global.log('info',logSystem, "Initializing %s/%s", [this.registerName,c]);
			
			bot.command(c,ctx => {
				self.setCommandContext(c,ctx)
			});
			bot.command(c + global.config.bot.name,ctx => {
				self.setCommandContext(c,ctx)
			});
		}
	}
}


module.exports = Registeries;