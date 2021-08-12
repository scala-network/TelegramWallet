/**
 * A Telegram Command. Address basically returns wallet*s) address.
 * To return current wallets address do /address or /address <index> for a singular wallet's address
 * @module Commands/address
 */
 const Command = require('./BaseCommand');

class AddressCommand extends Command {
	enabled = true;

	get name() {
        return "address";
    }
	
	get description() {
		return "Returns wallet address";
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		const User = this.loadModel("user");

		const user = await User.findWithWalletsById(ctx.from.id);
		
		if (!user) {
			return ctx.reply("User and wallet not avaliable please /create");
		}
		
		let output = "Wallets address: ";
		const wallets = user.wallets;
		if(wallets) {
			for(var i in wallets) {
				const wallet = wallets[i];
				output += '['+i+'] : ' + wallet.address;
				if((user.selected === null && i == 0) || user.selected === i) {
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
module.exports = AddressCommand;
