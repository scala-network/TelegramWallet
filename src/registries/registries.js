const logSystem = 'registry/registries';

class Registeries
{
	#_registers = {};

	get allowed() {
		return [];
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
		const allowRegisteries = Object.keys(this.getRegisters());
		const self = this;
		for(let i =0; i < allowRegisteries.length;i++) {
					
			let reg = allowRegisteries[i];
			const register = this.getRegister(reg);
	
			if(!register || !register.enabled) return;

			global.log('info',logSystem, "Initializing %s/%s", [this.registerName,reg]);

			this.setBotRegistry(register, bot);

		}
	}
}


module.exports = Registeries;