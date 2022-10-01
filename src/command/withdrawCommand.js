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

		if (currentMeta) {
			return ctx.appResponse.sendMessage(ctx.from.id, 'Confirmations still pending. Unable to create new request');
		}
		if (ctx.appRequest.args.length < 1) {
			return ctx.appResponse.reply(`Missing coin argument\n${this.description}`);
		}

		const coin = ctx.appRequest.args[0];

		if (!~global.config.coins.indexOf(coin)) {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}

		const coinObject = this.Coins.get(coin);
		const Wallet = this.loadModel('Wallet');
		
		let wallet = await Wallet.findByUserId(ctx.from.id, coin);

		if (!wallet) {
			return ctx.appResponse.reply(`No wallet avaliable for coin ${coin}`);
		}
		if (wallet && 'error' in wallet) {
			return ctx.reply("Wallet Error : " + wallet.error);
		}

		wallet = await Wallet.syncBalance(ctx.from.id, wallet, coinObject);
		if (wallet && 'error' in wallet) {
			return ctx.reply("Wallet Error : " + wallet.error);
		}

		if (ctx.appRequest.args.length < 2) {
			return ctx.appResponse.reply(`Missing coin address\n${this.description}`);
		}
		const address = ctx.appRequest.args[1];
		const valid = await coinObject.validateAddress(ctx.from.id, address);
		if (valid === null) return ctx.appResponse.reply('Unable to validate address');
		if (valid === false) return ctx.appResponse.reply('Address is not valid');

		if (ctx.appRequest.args.length < 3) {
			return ctx.appResponse.reply(`Missing sent amount\n${this.description}`);
		}
		const inputAmount = ctx.appRequest.args[2];
		if(isNaN(inputAmount) && inputAmount.trim().toLowerCase() !== 'all') {
			return ctx.appResponse.reply(`Invalid amount`);
		}
		let unlock = wallet.balance;
		if('unlock' in wallet) {
			unlock = wallet.unlock;
		}
		
		if('trading' in wallet) {
			unlock -= wallet.trading;
		}
		let trx;
		if(inputAmount.trim().toLowerCase() === 'all') {
			trx = await coinObject.sweep(ctx.from.id, wallet.wallet_id, address, true);
		} else {
			const amount = coinObject.parse(inputAmount);

			if (amount > parseFloat(unlock)) {
				return ctx.appResponse.reply('Insufficient fund');
			}

			trx = await coinObject.transferMany(ctx.from.id, wallet.wallet_id, [{ address, amount }], true);
		}
		if ('error' in trx) {
			return ctx.appResponse.reply(trx.error);
		}
		

		await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'), coin);
		const trxAmount = trx.amount_list.reduce((a, b) => a + b, 0);
		const trxFee = trx.fee_list.reduce((a, b) => a + b, 0);
		const x = await ctx.appResponse.reply(`
				<u>Pending Transaction Details</u>

				<b>From:</b>
				${wallet.address}

				<b>To:</b>
				${address}
				
				<b>Coin :</b> ${coinObject.symbol}
				<b>Amount :</b> ${coinObject.format(trxAmount)}
				<b>Fee :</b> ${coinObject.format(trxFee)}
				<b>Trx Expiry :</b> ${global.config.rpc.metaTTL} seconds
				<b>Current Balance :</b> ${coinObject.format(wallet.balance)}
				<b>Unlock Balance :</b> ${coinObject.format(unlock)}
				<b>Number of transactions :</b> ${trx.tx_hash_list.length}
				Choose to confirm or cancel transaction`, this.Helper.metaButton());
		setTimeout(() => {
			ctx.telegram.deleteMessage(x.chat.id,x.message_id).catch(e => {

			}).then(() => {
				ctx.reply("Transaction Action Timeout");
			});	

		}, global.config.rpc.metaTTL * 1000)
		
	}
}
module.exports = WithdrawCommand;
