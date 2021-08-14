/**
 * A Telegram Command. Height basically returns daemon and wallet(s) height.
 * To return all heights do /height
 * To a height for a selected wallet at index do /height <index> eg. /height 3
 * @module Commands/height
 */
const Command = require('./BaseCommand');

class HeightCommand extends Command {
	enabled = true;

	get description() {
		return "Returns wallet and daemon height";
	}

	get name() {
		return "height";
	}

	async run(ctx) {
        if(ctx.test)  return;
        const result = await this.loadModel("Network").lastHeight();	
        let output = "Daemon height: " +  result.height +" \n";
        output += "Sync Time: " +  result.timestamp +" \n";
        const {id} = ctx.from;

        if(!global.config.swm && !ctx.appRequest.is.group) {
        	const wallet = this.loadModel("Wallet").findByUserId(id);
			
			if(wallet) {
				output += "Wallet height: " +  wallet.height +" \n";
			} else {
				output +='No wallet avaliable';
			}
        }
        
      	ctx.reply(output);
		
	}

}

module.exports = HeightCommand;
