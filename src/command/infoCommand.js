/**
 * A Telegram Command. Balance basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */
const Command = require('../base/command');

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
		const Settings = this.loadModel("Setting");

		const result = await User.findAllById(ctx.from.id);
		if (!result) {
			return ctx.reply("User and wallet not avaliable please /create");
		}

		let totalBalance = 0;
		let output = "";
		output +='** User Information **\n';
		for(const i in User.fields) {
			const property = User.fields[i];
			if(!!~['wallet_id','wallet','status','id'].indexOf(property)) {
				continue;
			}
			output += '['+property+'] : ' + result[property] + "\n";
		}

		output +='\n** User Settings **\n';
		for(const i in Settings.fields) {
			const property = Settings.fields[i];
			let out = result[property];
			if(property == 'tip_submit') {
				out = (out == "enabled") ? "enabled" : "disabled";
			}else if(property == 'tip') {
				if(parseInt(out) < global.config.commands.tip) {
					out = global.config.commands.tip;
				}
				out = this.Coin.format(out);
			}
			output += '['+property+'] : ' + out + "\n";
		}

		output +='\n** WalletInformation **\n';

		const wallet = result.wallet;

		if(wallet) {
			output += 'Address : ' + wallet.address + "\n" ;
			output += 'Balance : ' + this.Coin.format(wallet.balance) + "\n" ;
			output += 'Unlock : ' + this.Coin.format(wallet.unlock?wallet.unlock:0) + "\n" ;
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
