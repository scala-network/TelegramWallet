const Query = require('../BaseQuery');


class Network  extends Query
{
	
	async lastHeight() {

		let sql = `SELECT height, timestamp FROM networks WHERE coin_id = ?`;
		const network = await global.sqlite.get(sql,[global.config.coin]);
		return {
			'height':network.height,
			'updated':network.updated
		};
	} 

	async addHeight(height) {
		let sql = `SELECT * FROM networks WHERE coin_id = ?`;
		const network = await global.sqlite.get(sql,[global.config.coin]);
		const now = Date.now();
		
		if(network) {
			let sql = `UPDATE members SET (updated=${Date.now()}) WHERE chat_id = ? AND member_id = ?`;

			let sql = `UPDATE networks SET(height=?, updated=?) WHERE coin_id = ?`;
			const network = await global.sqlite.get(sql,[
				height,
				Date.now(),
				global.config.coin
			]);
	
			return {
				'height':network.height,
				'updated':now
			};
		} 


		let sql = `INSERT INTO networks (coin_id, height, updated) VALUES (?,?,?)`;
		await global.sqlite.run(sql,[
			global.config.coin,
			height,
		]);

		return {
			'height':network.height,
			'updated':now
		};

	} 
}

module.exports = Network;