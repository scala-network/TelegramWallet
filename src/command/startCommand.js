'use strict';
const Command = require('../base/command');

const logSystem = 'command/start';

class StartCommand extends Command {
	get description () {
		return 'Function on start';
	}

	get name () {
		return 'start';
	}

	get needStart () {
		return false;
	}

	auth (ctx) {
		return !ctx.appRequest.is.group && ctx.appRequest.is.command;
	}

	async run (ctx) {
		if (ctx.test) return;

		const { id, username } = ctx.from;
		const User = this.loadModel('User');
		const Network = this.loadModel('Network');
		const Wallet = this.loadModel('Wallet');
		if (!username) {
			return ctx.send('To create an account user must have username');
		}

		const user = await User.add(id, username);

		let wallet;
		const coin = 'xla';
		const coinObject = this.Coins.get(coin);
		wallet = await Wallet.findByUserId(ctx.from.id, coin);
		if (wallet) return ctx.appResponse.reply(`Hello ${username}. Welcome back!`);

		if (user && parseInt(user.user_id) !== id) {
			await User.remove(id, username);
			return ctx.appResponse.reply('Account created failed');
		}
		if (coin in user) {
			wallet = await Wallet.findByUserId(user.user_id, coin);
		} else {
			wallet = user[coin];
		}

		const result = await coinObject.createSubAddress(user.user_id);

		if (!result) {
			return ctx.appResponse.reply('Unable to create address for wallet');
		}

		if ('error' in result) {
			return ctx.appResponse.reply(result.error);
		}

		const walletId = result.account_index;
		const address = result.address;

		global.log('info', logSystem, 'Create new subaddress for XLA \n\t\t=> %s\n\t\t=> %s', [
			`${user.user_id}@${username}`,
			`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
		]);
		const height = Network.lastHeight(coinObject);
		wallet = await Wallet.addByUser(user, address, walletId, height, coin);
		if (!wallet) return ctx.appResponse.reply('Unable to create address for wallet');
		if ('error' in wallet) return ctx.appResponse.reply('RPC Error: ' + wallet.error);

		ctx.appResponse.reply('😘<b>Welcome to Scala Telegram Wallet!</b>\nYour telegram is binded. Run /help for usages');

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

module.exports = StartCommand;
