const STATUS = require('../../../status');
const Query = require('../../../base/query');

class Address extends Query
{
	async findByUserId(user_id) {
		let sql = `SELECT address FROM wallets WHERE user_id = ? AND coin_id = ?`;
		return await global.sqlite.get(sql, [user_id, global.config.coin]).address;
	}
}


module.exports = Address;