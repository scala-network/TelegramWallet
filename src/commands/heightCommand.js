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
        const result = await this.loadModel("User").findWithWalletsAndDaemonHeightById(ctx.from.id);

		let output = "Daemon height: " +  result.height +" \n";
		output += "Wallets height:\n";

		if(result.wallets) {

			for(var i in result.wallets) {

				output += '['+i+']';

				output +=' : ' + result.wallets[i].height;

				if((results[1] === null && i == 0) || result.user.selected === i) {
					output += ' [s]';
				}
				output +='\n';

			}
		} else {
			output +='No wallet avaliable';
		}
		ctx.reply(output);
		
	}

}

module.exports = HeightCommand;
