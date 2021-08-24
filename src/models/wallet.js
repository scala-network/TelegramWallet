const Model = require('./base');

class Wallet extends Model
{
	get fields() {
		return [
			"id",
			"user_id",
			"address",
			"last_sync",
			"height",
			"balance",
			"unlocked",
			"status"
		];
	} 
	
	get className() {
		return 'wallet';
	}
	
	findByUserId(id, options) {
		return this.Query(options).findByUserId(id);
	}
	
	addByUser(user, address, options) {
		return this.Query(options).addByUser(user, address);
	}

	update(wallet, options) {
		return this.Query(options).update(wallet);
	}

	metaToUid(id, tx_meta, options) {
		return this.Query(options).metaToUid(id, tx_meta);
	}

	uidToMeta(id, uid, options) {
		return this.Query(options).uidToMeta(id, uid);
	}
}


module.exports = Wallet;