'use strict';
const Model = require('../base/model');

class Setting extends Model {
	get fields () {
		return [
			'rain',
			'tip',
			'tip_submit',
			'rain_submit',
			'rain_max'
		];
	}

	get className () {
		return 'setting';
	}

	updateField (id, field, value, options) {
		return this.Query(options).updateField(id, field, value);
	}

	findAllByUserId (userId, options) {
		return this.Query(options).findAllByUserId(userId);
	}

	findByFieldAndUserId (field, userId, options) {
		return this.Query(options).findByFieldAndUserId(field, userId);
	}

	validateValue (field, value) {
		switch (field) {
		case 'tip_submit':
		case 'rain_submit':
			if (typeof value === 'undefined') {
				return 'disable';
			}
			value = value.toLowerCase();
			if (!~['enable', 'disable'].indexOf(value)) {
				return 'disable';
			}
			break;
		case 'tip':
		case 'rain':
			value = parseInt(value) || 0;
			const tip = parseInt(global.config.commands[field] ? global.config.commands[field] : value);
			if (value < tip) {
				return tip;
			}
			break;
		case 'rain_max':
			value = parseInt(value) || 0;
			const _max = parseInt(global.config.commands.rain_max ? global.config.commands.rain_max : 20);
			if (value > _max) {
				return _max;
			}

			const _min = parseInt(global.config.commands.rain_min ? global.config.commands.rain_min : 1);
			if (value < _min) {
				return _max;
			}
			break;
		default:
			return false;
		}

		return value;
	}
}

module.exports = Setting;
