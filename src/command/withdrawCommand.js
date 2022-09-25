/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');

class WithdrawCommand extends Command {
	get name () {
		return 'withdraw';
	}

	get description () {
		return 'Withdraw coins in wallet. Use all as amount to withdraw all from account (usages : /withdraw coin coin_address amount)';
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		if (ctx.appRequest.args.length <= 2) {
			return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
		}

		const Wallet = this.loadModel('Wallet');
		const Meta = this.loadModel('Meta');
		const address = ctx.appRequest.args[1];
		const valid = await this.Coin.validateAddress(ctx.from.id, address);

		switch (valid) {
		case null:
			return ctx.appResponse.reply('Unable to validate address');
		case false:
			return ctx.appResponse.reply('Address is not valid');
		case true:
			let wallet = await Wallet.findByUserId(ctx.from.id);

			if (!wallet) {
				return ctx.appResponse.reply('No wallet avaliable');
			}

			wallet = await Wallet.syncBalance(ctx.from.id, wallet, this.Coin);
			if (wallet && 'error' in wallet) {
				return ctx.sendMessage(ctx.from.id, wallet.error);
			}

			let trx;
			if (ctx.appRequest.args[1].trim().toLowerCase() === 'all') {
				trx = await this.Coin.sweep(ctx.from.id, wallet.wallet_id, address, true);
			} else {
				const amount = this.Coin.parse(ctx.appRequest.args[1]);
				if (amount > parseFloat(wallet.unlock)) {
					return ctx.appResponse.reply('Insufficient fund');
				}

				trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, [{ address, amount }], true);
			}
			if ('error' in trx) {
				return ctx.appResponse.reply(trx.error);
			}

			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));
			const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
			const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
			// const balance = parseInt(wallet.balance) - parseInt(trx_amount) - parseInt(trx_fee);
			return ctx.appResponse.reply(`
				<u>Transaction Details</u>

				<b>From:</b>
				${wallet.address}

				<b>To:</b>
				${address}
				
				<b>Amount :</b> ${this.Coin.format(trxAmount)}
				<b>Fee :</b> ${this.Coin.format(trxFee)}
				<b>Trx Meta ID :</b> ${uuid}
				<b>Trx Expiry :</b> ${global.config.rpc.metaTTL} seconds
				<b>Current Unlock Balance :</b> ${this.Coin.format(wallet.balance)}
				<b>Number of transactions :</b> ${trx.tx_hash_list.length}
				Press button below to confirm`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: 'Confirm?', callback_data: 'meta' }]
					],
					resize_keyboard: true,
					one_time_keyboard: true
				}
			});
		default:
			if (valid) {
				return ctx.appResponse.reply(valid);
			}

			return ctx.appResponse.reply('Unable to withdraw coin');
		}
	}
}
module.exports = WithdrawCommand;
