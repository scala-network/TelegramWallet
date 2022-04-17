const Model = require('../base/model');

class Meta extends Model
{

	get fields() {
		return [
			"id",
			"meta",
			"user_id",
			"expired"
		];
	};

	get className() {
		return 'meta';
	}
	
	async getId(user_id, tx_meta, options) {
		return this.Query(options).getId(user_id, tx_meta);
	}

	async findById(user_id, id, options) {
		return this.Query(options).findById(user_id, id);
	}

	async getByUserId(user_id, options) {
		return this.Query(options).getByUserId(user_id);
	}

	async deleteMeta(user_id, id, options) {
		return this.Query(options).deleteMeta(user_id, id);
	}


	async relay(Coin, metas) {
		const explorer = [];
		const tx_hashes = [];
		for(let meta of mts.split(':')) {
			const tx = await Coin.relay(ctx.from.id, meta);
			if('error' in tx)  return tx.error;

			const tx_hash = tx.tx_hash;
			explorer.push(Coin.explorerLink(tx_hash));
			tx_hashes.push(tx_hash);
		}

		await this.deleteMeta(ctx.from.id, mts);
		return `<u>Transaction completed</u>
Number of transactions: ${tx_hashes.length}
Trx Hashes : 
* ${tx_hashes.join("\n *")}
Explorer : 
* ${explorer.join("\n * ")}`;

	}

}


module.exports = Meta;