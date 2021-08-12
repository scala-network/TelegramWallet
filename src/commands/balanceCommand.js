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

    enabled = true;

	async run(ctx,callback){
		if(ctx.test)  return;
		
		const User = this.loadModel("user");

		const user = await User.findWithWalletsById(ctx.from.id);
		
		if (!user) {
			return ctx.reply("User and wallet not avaliable please /create");
		}
		let totalBalance = 0;
		let output = "";
		const wallets = user.wallets;
		if(wallets) {
			for(var i in wallets) {
				const wallet = wallets[i];
				output += '['+i+'] : ' + wallet.balance;
				if((user.selected === null && i == 0) || user.selected === i) {
					output += ' [s]';
				}
				output +='\n';
				totalBalance+=wallet.balance;
			}
		} else {
			output +='No wallet avaliable';
		}

		output+="\nTotal Balance : " + totalBalance;
		
		ctx.reply(output);

	}
}

module.exports = BalanceCommand;
