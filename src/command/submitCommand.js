/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');
const STATUS = require('../status');

class SubmitCommand extends Command {
	enabled = true;

	get name() {
        return "submit";
    }
	
	get description() {
		return "Submit confirms sending coin by keying key generated from transfer command (usage /submit <trx_key>)";
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing argument for trx key\n${this.description}`);
        }
		
		const Meta = this.loadModel('Meta');

		const meta = await Meta.findById(ctx.appRequest.args[0], ctx.from.id);

		if(!meta) {
			return ctx.reply("Invalid or expired meta id");
		}

		const tx = await this.Coin.relay(ctx.from.id, meta);
		if('error' in tx) {
			return ctx.reply(tx.error);
		}

		const tx_hash = tx.tx_hash;

		return ctx.reply(`
			** Transaction completed **
			Trx Hash : ${tx_hash}
			Explorer : ${this.Coin.explorerLink(tx_hash)}
		`);

	}
}
module.exports = SubmitCommand;
