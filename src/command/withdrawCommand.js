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

		const Meta = this.loadModel('Meta');

		const currentMeta = await Meta.getByUserId(ctx.from.id);

		if(currentMeta) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'Confirmations still pending. Unable to create new request');
		}

		if (ctx.appRequest.args.length < 3) {
			return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
		}
		let coin;
		if (ctx.appRequest.args.length >= 1) {
			coin = (''+ctx.appRequest.args[0]).trim().toLowerCase();
		}
		if(!coin) {
			coin = 'xla';
		}
		if(!~global.config.coins.indexOf(coin)) {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}
		if (ctx.appRequest.args.length >= 2) {
			return ctx.appResponse.reply(`Missing coin address\n${this.description}`);
		}
		if (ctx.appRequest.args.length >= 3) {
			return ctx.appResponse.reply(`Missing sent amount\n${this.description}`);
		}
		
		const coinObject = this.Coins.get(coin);

		const Wallet = this.loadModel('Wallet');
		const address = ctx.appRequest.args[1];
		const valid = await coinObject.validateAddress(ctx.from.id, address);

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

			wallet = await Wallet.syncBalance(ctx.from.id, wallet, coinObject);
			if (wallet && 'error' in wallet) {
				return ctx.sendMessage(ctx.from.id, wallet.error);
			}

			let trx;
			if (ctx.appRequest.args[2].trim().toLowerCase() === 'all') {
				trx = await coinObject.sweep(ctx.from.id, wallet.wallet_id, address, true);
			} else {
				const amount = coinObject.parse(ctx.appRequest.args[2]);
				if (amount > parseFloat(wallet.unlock)) {
					return ctx.appResponse.reply('Insufficient fund');
				}

				trx = await coinObject.transferMany(ctx.from.id, wallet.wallet_id, [{ address, amount }], true, true);
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
				
				<b>Coin :</b> ${coinObject.symbol}
				<b>Amount :</b> ${coinObject.format(trxAmount)}
				<b>Fee :</b> ${coinObject.format(trxFee)}
				<b>Trx Meta ID :</b> ${uuid}
				<b>Trx Expiry :</b> ${global.config.rpc.metaTTL} seconds
				<b>Current Unlock Balance :</b> ${coinObject.format(wallet.balance)}
				<b>Number of transactions :</b> ${trx.tx_hash_list.length}
				Press button below to confirm`, this.Helper.metaButton());
		default:
			if (valid) {
				return ctx.appResponse.reply(valid);
			}

			return ctx.appResponse.reply('Unable to withdraw coin');
		}
	}
}
module.exports = WithdrawCommand;
