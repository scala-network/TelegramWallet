'use strict';
/**
 */
const Action = require('../base/action');

class MetaAction extends Action {
	get name () {
		return 'meta';
	}

	get description () {
		return 'Meta submit to relay transaction';
	}

	async run (ctx) {
		if (ctx.test) return;
		const Meta = this.loadModel('Meta');

		const metas = await Meta.getByUserId(ctx.appRequest.from.id);
		if (!metas) return ctx.appResponse.reply('Invalid or expired meta id');
		const coin = metas.coin;
		const coinObject = this.Coins.get(coin);
		const explorer = [];
		const txHashes = [];
		for (const meta of metas.meta.split(':')) {
			const tx = await Coin.relay(userId, meta);
			if ('error' in tx) return tx.error;

			const txHash = tx.tx_hash;
			explorer.push(Coin.explorerLink(txHash));
			txHashes.push(txHash);
		}

		await Meta.deleteMeta(userId, metas);
		const response = `<u>Transaction completed</u>
Number of transactions: ${txHashes.length}
Trx Hashes : 
* ${txHashes.join('\n *')}
Explorer : 
* ${explorer.join('\n * ')}`;
		return await ctx.editMessageText(response,{
			parse_mode: 'HTML'
		});
	}
}
module.exports = MetaAction;
