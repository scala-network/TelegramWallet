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
			if (!user.wallet) {
				wallet = await Wallet.findByUserId(user.user_id);
			} else {
				wallet = user.wallet;
			}

			let address;
			let walletId;
			if (wallet) {
				address = wallet.address;
				walletId = wallet.wallet_id;
			} else {
				walletId = user.wallet_id;
			}

			let result;

			if (user.status === STATUS.WALLET_REQUIRED || !walletId) {
				result = await this.Coin.createSubAddress(user.user_id);

				if (!result) {
					// await User.remove(id);
					return ctx.appResponse.reply('Unable to create address for wallet');
				}

				if ('error' in result) {
					return ctx.appResponse.reply(result.error);
				}

				walletId = result.account_index;
				address = result.address;

				global.log('info', logSystem, 'Create new subaddress for \n\t\t=> %s\n\t\t=> %s', [
					`${user.user_id}@${username}`,
					`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
				]);
			}

			if (!address && walletId) {
				result = await this.Coin.getAddress(user.user_id, walletId);
				if (result) {
					if ('error' in result) {
						global.log('error', logSystem, 'Getting old subaddress for %s at %s\n %s', [
							`${user.user_id}@${username}`, walletId, result.error.message
						]);

						return ctx.appResponse.reply(result.error.message);
					}

					if (result.addresses.length > 0) {
						address = result.addresses[0].address;
					}

					global.log('info', logSystem, 'Create old subaddress for \n\t\t=> %s\n\t\t=> %s', [
						`${user.user_id}@${username}`,
						`${address.slice(0, 5)}...${address.slice(address.length - 5)} : ${walletId}`
					]);
				}
			}

			if (user.status === STATUS.WALLET_REQUIRED && address && walletId) {
				const Network = this.loadModel('Network');

				const network = Network.lastHeight(this.Coin);
				let height;
				if (!network || !network.height) {
					height = 0;
				}
				wallet = await Wallet.addByUser(user, address, walletId, height);
			} else if (
				(!walletId && wallet.wallet_id !== walletId) ||
                    (!address && wallet.address !== address)
			) {
				wallet = await Wallet.update(user.user_id, wallet);
			}

			if (wallet) {
				return ctx.appResponse.reply('Account created successfully');
			}
			await User.remove(id, username);

			return ctx.appResponse.reply('Account creation failed');
		}
	}
}

module.exports = StartCommand;
