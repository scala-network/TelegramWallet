/**
 * A Telegram Command. Balance basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */
const Command = require('./BaseCommand');

class InfoCommand extends Command {
	get name () {
		return "info";
	}

	get description() {
        return "Returns information about your profile and wallets";
    }

    auth(ctx) {
        return !ctx.appRequest.is.group;
    }

    enabled = true;

	async run(ctx,callback){
		if(ctx.test)  return;
		
		const User = this.loadModel("user");

		const result = await User.findAllById(ctx.from.id);
		if (!result) {
			return ctx.reply("User and wallet not avaliable please /create");
		}

		let totalBalance = 0;
		let output = "";
		output +='** User Information **\n';
		for(const i in User.properties) {
			const property = User.properties[i];
			if(!!~['wallet_id','wallet','status','id'].indexOf(property)) {
				continue;
			}
			output += '['+property+'] : ' + result[property] + "\n";
		}

		output +='\n** WalletInformation **\n';

		const wallet = result.wallet;

		if(wallet) {
			output += 'Address : ' + wallet.address + "\n" ;
			output += 'Balance : ' + wallet.balance + "\n" ;
			output += 'Unlock : ' + (wallet.unlock?wallet.unlock:0) + "\n" ;
			if(!global.config.swm) {
				output += 'Height : ' + wallet.height + "\n" ;	
			}
		} else {
			output +='No wallet avaliable\n';
		}

		ctx.reply(output);

	}
}

module.exports = InfoCommand;
