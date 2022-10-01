'use strict';
/**
*/
const Action = require('../base/action');
const logSystem = 'action/address';
class AddressAction extends Action {
	get name () {
		return 'address';
	}

	get haveArguments () {
		return Action.ALPHA_ARGUMENTS;
	}

	get description () {
		return 'Meta submit to relay transaction';
	}

	async run (ctx) {
		if (ctx.test) return;
		const coin = ctx.match[1].toLowerCase();
		const Wallet = this.loadModel('Wallet');
		const Network = this.loadModel('Network');
		let output = '<u>Wallet address:</u>\n\n';
		const wallets = await Wallet.findByUserId(ctx.from.id);
		const user = await this.loadModel('User').findById(ctx.from.id);

		if (!!~global.config.coins.indexOf(coin) && !(coin in wallets && wallets[coin] !== null)) {
			const co = this.Coins.get(coin);
			const result = await co.createSubAddress(ctx.from.id);

			if (!result) {
				return ctx.appResponse.reply(`Unable to create address for wallet ${coin}`);
			}

			if ('error' in result) {
				return ctx.appResponse.reply(result.error);
			}

			const walletId = result.account_index;
			const address = result.address;
			const network = Network.lastHeight(co);
			let height;
			if (!network || !network.height) {
				height = 0;
			}
			const create = await Wallet.addByUser(user, address, walletId, height, coin);
			if (create) {
				global.log('info', logSystem, `Create new subaddress for ${coin} \n\t\t=> %s\n\t\t=> %s`, [
					`${user.user_id}@${user.username}`,
					`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
				]);
				wallets[coin] = create;
			}
		}
		const outputs = [];
		const buttons = [];
		if (wallets) {
			for (const coin of global.config.coins) {
				const coinObject = this.Coins.get(coin);
				if (coin in wallets && wallets[coin] !== null) {
					const wallet = wallets[coin];
					outputs.push(`<b>${coinObject.fullname}(${coinObject.symbol})</b> :\n${wallet.address}`);
				} else {
					buttons.push({
						text: `Create ${coinObject.fullname}(${coinObject.symbol}) Address`,
						callback_data: `address-${coin}`
					});
				}
			}
		} else {
			output = 'No wallet avaliable';
		}

		output += outputs.join('\n\n');
		if (!~global.config.coins.indexOf(coin.toLowerCase())) {
			output += `\n\nCoin ${coin} not avaliable`;
		}

		return ctx.editMessageText(output, {
			parse_mode: 'HTML'
		});
	}
}
module.exports = AddressAction;
