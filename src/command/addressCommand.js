'use strict'
/**
 * A Telegram Command. Address basically returns wallet*s) address.
 * To return current wallets address do /address 
 * 
 * @module Commands/address
 */
const Command = require('../base/command');

class AddressCommand extends Command {

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
		let output = "Wallet address: ";

		if(wallet) {
			output +=wallet.address;
		} else {
			output +='No wallet avaliable';
		}

		ctx.appResponse.reply(output);
	}
}
module.exports = AddressCommand;
