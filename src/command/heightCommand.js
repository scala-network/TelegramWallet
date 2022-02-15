/**
 * A Telegram Command. Height basically returns daemon and wallet(s) height.
 * To return all heights do /height
 * To a height for a selected wallet at index do /height <index> eg. /height 3
 * @module Commands/height
 */
const Command = require('../base/command');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US')
const logSystem = "command/height";

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
        let now = Date.now();
        let timestamp;
        let height = 0;
        const step = now - (global.config.rpc.interval * 1000);
        const Network = this.loadModel("Network");
        const result = await Network.lastHeight(this.Coin);
        

        let output = "Coin ID :" + this.Coin.symbol +" \n";
		output = "Daemon height: " +  result.height +" \n";
        output += "Sync Time: " +  timeAgo.format(parseInt(result.updated),'round') +" \n";
        const {id} = ctx.from;

        if(!ctx.appRequest.is.group) {
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
