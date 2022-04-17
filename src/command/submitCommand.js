/**
 * A Telegram Command. Transfer sends coin to username.
 * To return current wallets address do /transfer <username> <amount>
 * @module Commands/transfer
 */
const Command = require('../base/command');
const STATUS = require('../status');

class SubmitCommand extends Command {

	get name() {
        return "submit";
    }
	
	get description() {
		return "Submit confirms sending coin by keying key generated from transfer command (usage /submit trx_key)";
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		const Meta = this.loadModel('Meta');
		const Coin = this.Coin;
		const relay = mts => {
			const explorer = [];
			const tx_hashes = [];
			for(let meta of mts.split(':')) {
				const tx = await Coin.relay(ctx.from.id, meta);
				if('error' in tx) {
					return ctx.appResponse.reply(tx.error);
				}

				const tx_hash = tx.tx_hash;
				explorer.push(Coin.explorerLink(tx_hash));
				tx_hashes.push(tx_hash);
			}

			await Meta.deleteMeta(ctx.from.id, mts);
			return ctx.appResponse.reply(`
				<u>Transaction completed</u>
				Number of transactions: ${tx_hashes.length}
				Trx Hashes : 
				* ${tx_hashes.join("\n *")}
				Explorer : 
				* ${explorer.join("\n * ")}
			`);
		}
		
		await ctx.answerCbQuery();

		if(ctx.appRequest.args.length <= 0) {
			const umetas = await Meta.getByUserId(ctx.from.id);
			if(!umetas) return ctx.appResponse.reply(`Missing argument for trx key\n${this.description}`);
			return relay(umetas);
        }
		
		const metas = await Meta.findById(ctx.from.id, ctx.appRequest.args[0]);

		if(!metas) return ctx.appResponse.reply("Invalid or expired meta id");
		
		return relay(metas);

	}
}
module.exports = SubmitCommand;
