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

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		const Wallet = this.loadModel("Wallet");

		const wallet = await Wallet.findByUserId(ctx.from.id);
		let output = "Wallets address: ";

		if(wallet) {
			output +=wallet.address;
		} else {
			output +='No wallet avaliable';
		}

		ctx.reply(output);
	}
}
module.exports = AddressCommand;
