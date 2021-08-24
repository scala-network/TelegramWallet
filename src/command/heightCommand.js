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
        const result = await Network.lastHeight();
        
        if(result.height == 0 || result.timestamp < step) {
        	const resultFromCoin = await this.Coin.getHeight(ctx.from.id);
        	height = resultFromCoin.result.height;
        	timestamp = now;
	        Network.addHeight(height);
	  
	      //   global.log('info',logSystem,"Fetched from last height %s : %s", [
		     // 	height,now - parseInt(timestamp)
		     // ]);
   	
        } else {
        	timestamp = result.timestamp;
        	height = result.height;
        }


        let output = "Daemon height: " +  height +" \n";
        output += "Sync Time: " +  timeAgo.format(parseInt(timestamp),'round') +" \n";
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
