const STATUS = require('../../../status');

const logSystem = "model/sqlite/user";
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class User  extends Query
{

	async updateField(user_id, field, value) {
		
		const exists = await this.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        if(!~this.fields.indexOf(field)) {
        	return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
        }
		
		const result = await global.sqlite.run(`UPDATE FROM users SET(${field}=?) WHERE coin_id = ? AND user_id = ?`,[
			value,
			global.config.coin, 
			user_id
		]);

        if(!result) {
        	return STATUS.ERROR_MODEL_UPDATE;
        }

        return STATUS.OK;
	}


	async findByUsername(username) {
        
		const sql = `SELECT * FROM users WHERE username=? AND coin_id=?`;

		const result = await global.sqlite.get(sql,[
			username,
			global.config.coin
		]);

        if(!result) {
        	return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        return result;

	}

	async findById(user_id) {
		const sql = `SELECT * FROM users WHERE user_id=? AND coin_id=?`;

		const results = await global.sqlite.get(sql,[
			user_id,
			global.config.coin
		]);

        if(!results) {
        	return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

		const Wallet = Model.LoadRegistry("Wallet");

		const wallet = Wallet.findByUserId(user_id);

		if(wallet) {
			results.wallet = wallet;
		}

		const Settings = Model.LoadRegistry("Settings");

		const settings = Settings.findAllByUserId(user_id);
		

		return Object.assign(settings,results);
	}

	async exists(user_id) {
		const sql = `SELECT user_id FROM users WHERE user_id=? AND coin_id=?`;
		const result = await global.sqlite.get(sql,[
			user_id,
			global.config.coin
		]);
		return (!result && result.user_id == user_id);
	}

	async remove(id, username) {
        
	}

	async add(user_id, username) {
		
		const exists = this.exists(user_id);

		if(exists) {
			return STATUS.ERROR_ACCOUNT_EXISTS;
        }

		const user = {
			user_id,
			username,
			updated:Date.now(),
			coin_id : global.config.coin,
			status : STATUS.WALLET_REQUIRED
		};

		const values = Object.values(user);
		const sqlvalues = Array(values.length).fill("?").join(',');
		let sql = `INSERT INTO wallets (${Object.keys(user).join(',')}) VALUES (${sqlvalues})`;

		await global.sqlite.run(sql,values);

		return user;
	}
}

module.exports = User;