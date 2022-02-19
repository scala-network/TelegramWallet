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
            return ctx.appResponse.reply(`Missing argument for trx key\n${this.description}`);
        }
		
		const Meta = this.loadModel('Meta');

		const metas = await Meta.findById(ctx.appRequest.args[0], ctx.from.id);

		if(!metas) {
			return ctx.appResponse.reply("Invalid or expired meta id");
		}
		const explorer = [];
		const tx_hashes = [];
		for(let meta of metas.split(':')) {
			const tx = await this.Coin.relay(ctx.from.id, meta);
			if('error' in tx) {
				return ctx.appResponse.reply(tx.error);
			}

			const tx_hash = tx.tx_hash;
			explorer.push(this.Coin.explorerLink(tx_hash));
			tx_hashes.push(tx_hash);
		}
		return ctx.appResponse.reply(`
			** Transaction completed **
			Number of transactions: ${tx_hashes.length}
			Trx Hashes : 
			* ${tx_hashes.join("\n *")}
			Explorer : 
			* ${explorer.join("\n * ")}
		`);

	}
}
module.exports = SubmitCommand;
