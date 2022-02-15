/**
 * A Telegram Command. Balance basically returns daemon height.
 * To return current daemon height do /height
 * @module Commands/height
 */
const Command = require('../base/command');
const utils = require('../utils');

class InfoCommand extends Command {
	get name() {
		return "info";
	}

	get description() {
		return "Returns information about your profile and wallets";
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	enabled = true;

	async run(ctx, callback) {
		if (ctx.test) return;

		const User = this.loadModel("user");
		const Wallet = this.loadModel("Wallet");
		const Settings = this.loadModel("Setting");


		let result = await User.findById(ctx.from.id);
		if (!result) {
			return ctx.reply("User and wallet not avaliable please /create");
		}

		let totalBalance = 0;
		let output = "";
		output += '** User Information **\n';
		for (const i in User.fields) {
			const field = User.fields[i];
			if (!!~['wallet_id', 'wallet', 'status', 'user_id', 'coin_id'].indexOf(field)) {
				continue;
			}
			output += `[${field}] : ${result[field]}\n`;
		}

		if (!result.tip) {
			const setting = await Settings.findAllByUserId(ctx.from.id);
			if(setting) {
				result = Object.assign(setting, result);
			}
		}
		output += '\n** User Settings **\n';
		for (const i in Settings.fields) {
			const field = Settings.fields[i];
			
			let out = Settings.validateValue(field,result[field]);
			switch (field) {
				case 'tip':
				case 'rain':
					out = this.Coin.format(out);
					break;
				case 'tip_submit':
				default:
					if(out === false) {
						out = 'disabled';
					}
					break;
			}
			output += `[${field}] : ${out}\n`;
		}

		output += '\n** WalletInformation **\n';

		const wallet = result.wallet ? result.wallet : await Wallet.findByUserId(ctx.from.id);

		if (wallet) {
			output += `Address : ${wallet.address}\n`;
			output += `Balance : ${utils.formatNumber(this.Coin.format(wallet.balance))}\n`;
			output += `Unlock : ${utils.formatNumber(this.Coin.format(wallet.unlock ? wallet.unlock : 0))}\n`;
			output += `Height : ${utils.formatNumber(wallet.height)}\n`;
		} else {
			output += 'No wallet avaliable\n';
		}

		ctx.reply(output);

	}
}

module.exports = InfoCommand;
