const { STATUS_CODES } = require('http');
const Model = require('../base/model');

class Setting extends Model
{
	get fields() {
		return [
			"rain",
			"tip",
			"tip_submit"
		];
	} 
	
	get className() {
		return 'setting';
	}


	updateField(id, field, value, options) {
		return this.Query(options).updateField(id, field, value);
	}

	findAllByUserId(user_id, options) {
		return this.Query(options).findAllByUserId(user_id);
	}

	findByFieldAndUserId(field,user_id, options) {
		return this.Query(options).findByFieldAndUserId(field,user_id);
	}

	validateValue(field, value) {
		switch(field) {
			case 'tip_submit':
				if(typeof value == 'undefined') {
					return false;
				}
				value = value.toLowerCase();
				if (!~['enabled','disabled'].indexOf(value)) {
					return false;
				}
				break;
			case 'tip':
				value = parseInt(value) || 0;
				const tip = parseInt(global.config.commands.tip ? global.config.commands.tip :100000);
				if(value <= tip) {
					return tip;
				}
				break;
			case 'rain':
				value = parseInt(value) || 0;
				const rain = parseInt(global.config.commands.rain ?global.config.commands.rain :1000);
				if(value <= rain) {
					return rain;
				}
				break;
			default:
				break;
		}

		return value;
		
	}
}


module.exports = Setting;