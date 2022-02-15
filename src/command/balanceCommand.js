/**
 * A Telegram Command. Balance returns wallet balance.
 * @module Commands/balance
 */

const Command = require('../base/command');
const utils = require('../utils');
const TimeAgo = require('javascript-time-ago');
const timeAgo = new TimeAgo('en-US')
const logSystem = "command/balance";

class BalanceCommand extends Command {
	get name () {
		return "balance";
	}

	get description() {
        return "Returns all wallet(s) balance";
    }

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}
    
    enabled = true;

	async run(ctx){
		if(ctx.test)  return;
		
		const Wallet = this.loadModel("Wallet");

		let wallet = await Wallet.findByUserId(ctx.from.id);
		let output = "*** Wallet Information ***\n";

		if(wallet) {
			wallet = await Wallet.syncBalance(ctx, wallet, this.Coin);
			
			output +=`Coin ID: ${wallet.coin_id}\n`;
			output +=`Balance: ${utils.formatNumber(this.Coin.format(wallet.balance))}\n`;
			output +=`Unlocked Balance: ${utils.formatNumber(this.Coin.format(wallet.unlock))}\n`;
			output +=`Last Sync: ${timeAgo.format(parseInt(wallet.updated),'round')}\n`;
			output +=`Last Height: ${utils.formatNumber(wallet.height)}\n`;

			if(wallet.pending > 0) {
				output +=`Confirmations Remaining: ${wallet.pending}\n`;	
			}
			
		} else {
			output +='No wallet avaliable';
		}

		ctx.reply(output);

	}
}

module.exports = BalanceCommand;
