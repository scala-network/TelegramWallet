/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('./BaseCommand');
const STATUS = require('../status');

class TransferCommand extends Command {
	enabled = true;

	get name() {
        return "transfer";
    }
	
	get description() {
		return "Transfer coin to another user (usages : /transfer <username> <amount>)";
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 2) {
            return ctx.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");

		const user = User.findByUsername(ctx.appRequest.args[1]);

		if(user === STATUS.ERROR_ACCOUNT_NOT_EXISTS) {
			return ctx.reply("User account is not avaliable. Share bot to user and create account");
		}

		let wallet = await Wallet.findByUserId(ctx.from.id);

		if(!wallet) {
			return ctx.reply('No wallet avaliable');
		}
		let now = Date.now();
		const step = now - (global.config.rpc.interval * 1000);

		if(parseInt(wallet.last_sync) <= step) {
			const result = await this.Coin.getBalance(ctx.from.id, wallet.id);
			wallet.balance = result.result.balance;
			wallet.unlock = result.result.unlocked_balance;
			wallet = await Wallet.update(wallet);
		}

		const amount = this.Coin.parse(ctx.appRequest.args[1]);
		if(amount > parseFloat(wallet.unlock)) {
			return ctx.reply('Insufficient fund');	
		}

		const trx = await this.Coin.transfer(ctx.from.id, wallet.id,user.wallet.address, amount);



	}
}
module.exports = TransferCommand;
