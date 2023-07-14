'use strict';
/**
 */
const Action = require('../base/action');

class MetaConfirmAction extends Action {
	get name () {
		return 'meta_confirm';
	}

	get description () {
		return 'Meta confirm submission to relay transaction';
	}

	async run (ctx) {
		if (ctx.test) return;
		const Meta = this.loadModel('Meta');
		let x;
		try {
			x = await ctx.editMessageText('Processing Action');
			if (!x) return;
		} catch {
			return;
		}

		const metas = await Meta.getByUserId(ctx.from.id);
		if (!metas) {
			await ctx.reply('Invalid or expired meta id');
			await ctx.telegram.deleteMessage(x.chat.id, x.message_id).catch(e => {

			})
			return;
		}

		const coin = metas.coin;
		const coinObject = this.Coins.get(coin);
		if (!coinObject) {
			Meta.deleteMeta(ctx.appRequest.from.id);
			await ctx.reply(`Invalid coin ${coin}`);
			await ctx.telegram.deleteMessage(x.chat.id, x.message_id).catch(e => { });
			return;
		}
		const explorer = [];
		const txHashes = [];
		for (const meta of metas.meta.split(':')) {
			const tx = await coinObject.relay(ctx.from.id, meta);
			if ('error' in tx) {
				continue;
			}
			let txHash;
			if ('tx_hash' in tx) {
				txHash = tx.tx_hash;
				explorer.push(coinObject.explorerLink(txHash));
				txHashes.push(txHash);
			} else if ('tx_hash_list' in tx) {
				tx.tx_hash_list.forEach(thl => {
					explorer.push(coinObject.explorerLink(thl));
					txHashes.push(thl);
				});
			}
		}


		const response = `<b><u>Transaction completed for ${coinObject.fullname}</u></b>
Number of transactions: ${txHashes.length}
Trx Hashes : 
* ${txHashes.join('\n *')}
Explorer : 
* ${explorer.join('\n * ')}`;

		Meta.deleteMeta(ctx.from.id);
		await ctx.reply(response, {
			parse_mode: 'HTML'
		});
		await ctx.telegram.deleteMessage(x.chat.id, x.message_id).catch(e => {
		});
	}
}
module.exports = MetaConfirmAction;
