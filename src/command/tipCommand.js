/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /tip <username>
 * @module Commands/tip
 */
const Command = require('../base/command');
const STATUS = require('../status');
const Telegraf = require('telegraf');
const { STATUS_CODES } = require('http');

class TransferCommand extends Command {

	get name() {
        return "tip";
    }
	
	get description() {
		return "Tip coin to another user. To set default tip value go to /set tip <amount> (usages : /tip <username>) or you can custom tip /tip <username> <custom_amount>";
	}

	auth(ctx) {
		return true;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 0) {
            return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
        }

		const Wallet = this.loadModel("Wallet");
		const User = this.loadModel("User");
		const Meta = this.loadModel("Meta");
		const Setting = this.loadModel('Setting');
		const sender = await User.findById(ctx.from.id);
		if(!sender || sender === STATUS.ERROR_ACCOUNT_NOT_EXISTS){
			return ctx.appResponse.reply("User account not avaliable. Please create a wallet https://t.me/" + global.config.bot.username);
		}
		
		if(!('wallet' in sender) || sender === STATUS.ERROR_WALLET_NOT_AVALIABLE) {
			return ctx.appResponse.sendMessage(ctx.from.id,`No wallet avaliable`);
		}

		let wallet = await Wallet.syncBalance(ctx.from.id, sender.wallet, this.Coin);
		if(wallet && 'error' in wallet) {
			return ctx.sendMessage(ctx.from.id, wallet.error);
		}
		let username = ctx.appRequest.args[0].trim();
		if(username.startsWith("@")) {
			username = username.substr(1);
		}
		const user = await User.findByUsername(username);
		if(!user || user === STATUS.ERROR_ACCOUNT_NOT_EXISTS) {
			return ctx.appResponse.reply("User account not avaliable. Please create a wallet " +ctx.appRequest.args[0]+ " https://t.me/" + global.config.bot.username);
		}
		if(!user || !('wallet' in user) || user === STATUS.ERROR_WALLET_NOT_AVALIABLE) {
			return ctx.appResponse.reply("User wallet is not avaliable");
		}
		let tipAmount;
		if(ctx.appRequest.args.length > 1) {
			tipAmount = this.Coin.parse( ctx.appRequest.args[1]);
		} else {
			tipAmount = await Setting.findByFieldAndUserId('tip', ctx.from.id);
			
		}
		const amount = Setting.validateValue('tip', tipAmount);//Assuming 2% XLA transaction fee
		const estimate = amount * 1.01;//Assuming 1% XLA transaction fee

		
		if(estimate > parseFloat(wallet.unlock)) {
			return ctx.appResponse.sendMessage(ctx.from.id,'Insufficient fund estimate require ' + this.Coin.format(estimate));	
		}

		if(sender.tip_submit !== 'enable') {

			const trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, [{
				address : user.wallet.address, 
				amount
			}], true);
			if(!trx) {
				return ctx.appResponse.reply("No response from  RPC");
			}
			if('error' in trx) {
				return ctx.appResponse.reply(trx.error);
			}

			const uuid = await Meta.getId(ctx.from.id, trx.tx_metadata_list.join(':'));
			const ftrx_amount = trx.amount_list.reduce((a, b) => a + b, 0);
			const ftrx_fee = trx.fee_list.reduce((a, b) => a + b, 0);
			return ctx.appResponse.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
@${sender.username}

To: 
@${user.username}

Amount : ${this.Coin.format(ftrx_amount)}
Fee : ${this.Coin.format(ftrx_fee)}
Trx Meta ID: ${uuid}
Trx Expiry: ${global.config.rpc.metaTTL} seconds
Current Unlock Balance : ${this.Coin.format(wallet.balance)}
Number of transactions : ${trx.tx_hash_list.length}

To proceed with transaction run
/submit ${uuid} 
			`);

		} else {
			const trx = await this.Coin.transferSplit(ctx.from.id, wallet.wallet_id, user.wallet.address, amount, false);
			if('error' in trx) {
				return ctx.appResponse.reply(trx.error);
			}
			const trx_amount = trx.amount_list.reduce((a, b) => a + b, 0);
			const tx_hash = trx.tx_hash_list.join("\n * ");
			const trx_fee = trx.fee_list.reduce((a, b) => a + b, 0);
			const balance = parseInt(wallet.balance) - parseInt(trx_amount) - parseInt(trx_fee);

			await ctx.appResponse.sendMessage(ctx.from.id,`
** Transaction Details **

From: 
@${sender.username}

To: 
@${user.username}

Amount : ${this.Coin.format(trx_amount)}
Fee : ${this.Coin.format(trx_fee)}
Current Unlock Balance : ${this.Coin.format(wallet.balance)}
Number of transactions : ${trx.tx_hash_list.length}
			`);

			await ctx.appResponse.sendMessage(user.user_id,`
** Transaction Details **

From: 
@${sender.username}

To: 
@${user.username}

Amount : ${this.Coin.format(trx_amount)}
Fee : ${this.Coin.format(trx_fee)}
Number of transactions : ${trx.tx_hash_list.length}
Trx Hashes (${trx.amount_list.length} Transactions): 
* ${tx_hash}

			`);
			return;
		}
	}
}
module.exports = TransferCommand;
