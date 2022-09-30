'use strict';
const Command = require('../base/command');
const STATUS = require('../status');

const logSystem = 'command/start';

class StartCommand extends Command {
	get description () {
		let o = 'Function on start';
		if (!global.config.swm) {
			o += ' usages: /start';
		}
		return o;
	}

	get name () {
		return 'start';
	}
	get needStart() {
		return false;
	}
	auth (ctx) {
		return !ctx.appRequest.is.group && ctx.appRequest.is.command;
	}

	async run (ctx) {
		if (ctx.test) return;

		const { id, username } = ctx.from;
		const User = this.loadModel('User');
		const Wallet = this.loadModel('Wallet');
		if (!username) {
			return ctx.send('To create an account user must have username');
		}

		const user = await User.add(id, username);

		let wallet;
		const coin = 'xla';
		const coinObject = this.Coins.get(coin);
		switch (user) {
		case STATUS.ERROR_ACCOUNT_EXISTS:
			return ctx.appResponse.reply(`Hello ${username}. Welcome back!`);
		case STATUS.ERROR_CREATE_ACCOUNT:
			await User.remove(id, username);
			return ctx.appResponse.reply('Error creating account');
		default:
			if (user && parseInt(user.user_id) !== id) {
				await User.remove(id, username);
				return ctx.appResponse.reply('Account created failed');
			}
			if (coin in user) {
				wallet = await Wallet.findByUserId(user.user_id,coin);
			} else {
				wallet = user[coin];
			}

			let address;
			let walletId;
			if (wallet) {
				address = wallet.address;
				walletId = wallet.wallet_id;
			} else {
				walletId = user[coin+'_id'];
			}

			let result;

			if (user.status === STATUS.WALLET_REQUIRED || !walletId) {
				result = await coinObject.createSubAddress(user.user_id);

				if (!result) {
					// await User.remove(id);
					return ctx.appResponse.reply('Unable to create address for wallet');
				}

				if ('error' in result) {
					return ctx.appResponse.reply(result.error);
				}

				walletId = result.account_index;
				address = result.address;

				global.log('info', logSystem, 'Create new subaddress for XLA \n\t\t=> %s\n\t\t=> %s', [
					`${user.user_id}@${username}`,
					`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
				]);
			}

			if (!address && walletId) {
				result = await coinObject.getAddress(user.user_id, walletId);
				if (result) {
					if ('error' in result) {
						global.log('error', logSystem, 'Getting old subaddress for %s at %s\n %s', [
							`${user.user_id}@${username}`, walletId, result.error.message
						]);

						return ctx.appResponse.reply(result.error.message);
					}

					global.log('info', logSystem, 'Create old subaddress for \n\t\t=> %s\n\t\t=> %s', [
						`${user.user_id}@${username}`,
						`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
					]);
				}
			}

			if (user.status === STATUS.WALLET_REQUIRED && address && walletId) {
				const Network = this.loadModel('Network');

				const network = Network.lastHeight(coinObject);
				let height;
				if (!network || !network.height) {
					height = 0;
				}
				wallet = await Wallet.addByUser(user, address, walletId, height, coin);
			} else if (
				(!walletId && wallet.wallet_id !== walletId) ||
                    (!address && wallet.address !== address)
			) {
				wallet = await Wallet.update(user.user_id, wallet);
			}
			let output;
			if (wallet) {
				const Wallet = this.loadModel('Wallet');
		 		output += '😘<b>Welcome to Scala Telegram Wallet!</b>\nYour telegram is binded. Run /help for usages.\n<u>Wallet address:</u>\n\n';
		 		return ctx.appResponse.reply(output);
		 		output = "";
		 		const wallets = await Wallet.findByUserId(ctx.from.id);
		 		let outputs = [];
		 		let buttons = [];
		 		if (wallets) {
		 			for(let coin of global.config.coins) {
		 				const coinObject = this.Coins.get(coin);
		 				if(coin in wallets && wallets[coin]!== null){
		 					const wallet = wallets[coin];
		 					outputs.push(`<b>${coinObject.fullname}(${coinObject.symbol})</b> :\n${wallet.address}`);
		 				}
		 				else{
		 					buttons.push({
		 						text:`Create ${coinObject.fullname}(${coinObject.symbol}) Address`,
		 						// callback_data: `address-${coinObject.symbol.toLowerCase()}`
		 						callback_data: `address-${coin}`
		 					});
		 				}
		 					
		 			}
		 		} else {
		 			output = 'No wallet avaliable';
		 		}

		 		ctx.appResponse.reply(output+outputs.join('\n\n'),{
		 			reply_markup: {
		 				inline_keyboard: [buttons],
		 				resize_keyboard: false,
		 				one_time_keyboard: true,
		                remove_keyboard: true
		 			}
		 		});
				
			}

			await User.remove(id, username);

			return ctx.appResponse.reply('Account creation failed');
		}
	}
}

module.exports = StartCommand;
