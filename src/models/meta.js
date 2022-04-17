const Model = require('../base/model');

class Meta extends Model {
	get fields () {
		return [
			'id',
			'meta',
			'user_id',
			'expired'
		];
	}

	get className () {
		return 'meta';
	}

	async getId (userId, txMeta, options) {
		return this.Query(options).getId(userId, txMeta);
	}

	async findById (userId, id, options) {
		return this.Query(options).findById(userId, id);
	}

	async getByUserId (userId, options) {
		return this.Query(options).getByUserId(userId);
	}

	async deleteMeta (userId, id, options) {
		return this.Query(options).deleteMeta(userId, id);
	}

	async relay (userId, Coin, metas) {
		const explorer = [];
		const txHashes = [];
		for (const meta of metas.split(':')) {
			const tx = await Coin.relay(userId, meta);
			if ('error' in tx) return tx.error;

			const txHash = tx.tx_hash;
			explorer.push(Coin.explorerLink(txHash));
			txHashes.push(txHash);
		}

		await this.deleteMeta(userId, metas);
		return `<u>Transaction completed</u>
Number of transactions: ${txHashes.length}
Trx Hashes : 
* ${txHashes.join('\n *')}
Explorer : 
* ${explorer.join('\n * ')}`;
	}
}

module.exports = Meta;
