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

		const result = await User.findAllWithWalletsById(ctx.from.id);

		if (!result) {
			return ctx.reply("User and wallet not avaliable please /create");
		}

		let totalBalance = 0;
		let output = "";
		output +='**User Information**\n';
		if(result.user) {
			for(const i in User.properties) {
				const property = User.properties[i];
				output += '['+property+'] : ' + result.user[property] + "\n";
			}
		} else {
			output +='No info avaliable\n';
		}


		const wallets = result.wallets;
		output +='**Wallets Information**\n';

		if(wallets) {
			for(var i in wallets) {
				const wallet = wallets[i];
				output += '['+i+'] : ' + wallet.address ;
				if((user.selected === null && i == 0) || user.selected === i) {
					output += ' [s]';
				}
				output +='\n';
				output += 'Balance : ' + wallet.balance + "\n" ;
				output += 'Unlock : ' + wallet.unlock + "\n" ;
				output += 'Height : ' + wallet.height + "\n" ;

			}
		} else {
			output +='No wallet avaliable\n';
		}

		output+="Total Balance : " + totalBalance;
		
		ctx.reply(output);

	}
}

module.exports = InfoCommand;
