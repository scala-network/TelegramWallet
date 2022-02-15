const STATUS = require('../../../status');
const { v4: UUID } = require('uuid');
const Query = require('../BaseQuery');

class Meta  extends Query
{
	async getId(user_id, tx_meta) {
		const uuid = UUID();
		const now = Date.now() + global.config.rpc.metaTTL;
		let sql = `INSERT INTO metas (id, user_id, expiry, meta) values (?,?,?,?)`;
		await global.sqlite.run(sql, [uuid, id, now, meta]);
		return uuid;
	}

	async findById(id,user_id) {
		const now = Date.now();
		let sql = `SELECT * FROM metas WHERE id = '?' AND user_id = ? AND expiry > ?`;
		const result =  await global.sqlite.get(sql, [id, user_id, now]);
		return result ? result.meta : null;
	}

}

module.exports = Meta;

