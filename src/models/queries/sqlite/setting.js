const logSystem = "model/sqlite/setting";

const STATUS = require('../../../status');
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Setting  extends Query
{
	async updateField(user_id, field, value) {
		const User = Model.loadModel('User');
		
		const exists = await User.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

        if(!~this.fields.indexOf(field)) {
        	return STATUS.ERROR_MODEL_PROPERTIES_NOT_AVALIABLE;
        }
		
		const setting = await global.sqlite.get(`SELECT * FROM settings WHERE coin_id = ? AND user_id = ? AND field = ?`,[global.config.coin, user_id, field]);

		if(!setting) {
			await global.sqlite.run(`INSERT INTO settings SET(valued=?,coin_id = ?, user_id=?,field = ?)`,[value,global.config.coin, user_id, field]);
		} else {
			await global.sqlite.run(`UPDATE FROM settings SET(valued=?) WHERE coin_id = ? AND user_id = ? AND field = ?`,[value,global.config.coin, user_id, field]);
		}

        return STATUS.OK;
	}


	async findAllByUserId(user_id) {
		const User = Model.loadModel('User');
		
		const exists = await User.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

		const settings = await global.sqlite.all(`SELECT * FROM settings WHERE coin_id = ? AND user_id = ?`,[
			global.config.coin, 
			user_id
		]);

		let results = {};
		if(!settings) {
			return [];
		}
		for(let i=0;i<settings.length;i++){
			const setting = settings[i];
			const field = setting.field;
			if(!~this.fields.indexOf(field)) {
				continue;
			}

			results[field] = setting.valued;
		}

		return results;

	}

	findByFieldAndUserId(field,user_id, options) {
		const User = Model.loadModel('User');
		
		const exists = await User.exists(user_id);
		
		if(!exists) {
			return STATUS.ERROR_ACCOUNT_NOT_EXISTS;
        }

		const setting = await global.sqlite.get(`SELECT * FROM settings WHERE coin_id = ? AND user_id = ? AND field= ?`,[
			global.config.coin, 
			user_id,
			field
		]);

		let results = {};
		
		results[field] = (setting) ? setting.valued : null;


		return results;
	}

}

module.exports = Setting;