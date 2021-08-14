/**
 * A Telegram Command. Balance basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */
 const Command = require('./BaseCommand');

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

		const wallet = await Wallet.findByUserId(ctx.from.id);
		let output = "Wallets balance: ";

		if(wallet) {
			output +=wallet.balance;
		} else {
			output +='No wallet avaliable';
		}

		ctx.reply(output);

	}
}

module.exports = BalanceCommand;
