'use strict';
/**
* A Telegram Command. Address basically returns wallet*s) address.
* To return current wallets address do /address
*
* @module Commands/address
*/
const Command = require('../base/command');

class AddressCommand extends Command {
	get name () {
		return 'address';
	}

	get description () {
		return 'Returns wallet address';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		const Wallet = this.loadModel('Wallet');
		let output = '<u>Wallet address:</u>\n\n';
		const wallets = await Wallet.findByUserId(ctx.from.id);
		const outputs = [];
		const buttons = [];
		if (wallets) {
			for (const coin of global.config.coins) {
				const coinObject = this.Coins.get(coin);
				if (coin in wallets && wallets[coin] !== null) {
					const wallet = wallets[coin];
					outputs.push(`<b>${coinObject.fullname}(${coinObject.symbol})</b> :\n${wallet.address}`);
				} else if(coin !== 'vxla'){
					buttons.push({
						text: `Create ${coinObject.fullname}(${coinObject.symbol}) Address`,
						callback_data: `address-${coin}`
					});
				}
			}
		} else {
			output = 'No wallet avaliable';
		}

		ctx.appResponse.reply(output + outputs.join('\n\n'), {
			reply_markup: {
				inline_keyboard: [buttons],
				resize_keyboard: false,
				one_time_keyboard: true,
				remove_keyboard: true
			}
		});
	}
}
module.exports = AddressCommand;
