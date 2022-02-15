const logSystem = 'base/registries';
const cliProgress = require('cli-progress');

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
		const bar = new cliProgress.SingleBar({
			format: `${this.registerName} | {bar} | {percentage}% | {value}/{total}`
		}, cliProgress.Presets.shades_classic);

		bar.start(allowRegisteries.length, 0);
		for(let i =0; i < allowRegisteries.length;i++) {
					
			let reg = allowRegisteries[i];
			const register = this.getRegister(reg);
			bar.update(i+1);

			if(!register || !register.enabled) return;

			//global.log('info',logSystem, "Initializing %s/%s", [this.registerName,reg]);

			this.setBotRegistry(register, bot);

		}
		bar.stop();

	}
}


module.exports = Registeries;