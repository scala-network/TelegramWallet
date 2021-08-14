/**
 * A Telegram Command. Balance returns wallet balance.
 * @module Commands/balance
 */

const Command = require('./BaseCommand');
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
	        let now = Date.now();
			const step = now - (global.config.rpc.interval * 1000);
			if(parseInt(wallet.last_sync) <= step) {
				const result = await this.Coin.getBalance(ctx.from.id, wallet.id);
				wallet.balance = result.result.balance;
				wallet.unlock = result.result.unlocked_balance;
				wallet = await Wallet.update(wallet);
			}
			if(wallet) {
				output +=`Balance: ${wallet.balance}\n`;
				output +=`Unlocked Balance: ${wallet.unlock}\n`;
				output +=`Last Sync: ${timeAgo.format(parseInt(wallet.last_sync),'round')}\n`;
			} else {
				output +='Error retrieving record';
			}
			
		} else {
			output +='No wallet avaliable';
		}

		ctx.reply(output);

	}
}

module.exports = BalanceCommand;
