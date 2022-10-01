'use strict';
const Model = require('../base/model');

class Setting extends Model {
	get fields () {
		return [
			'rain',
			'tip',
			'tip_submit',
			'rain_submit',
			'wet'
		];
	}

	get className () {
		return 'setting';
	}

	updateField (id, field, value, coin = 'xla', options = []) {
		return this.Query(options).updateField(id, field, value, coin);
	}

	findAllByUserId (userId, coin = 'xla', options = []) {
		return this.Query(options).findAllByUserId(userId, coin);
	}

	findByFieldAndUserId (field, userId, coin = 'xla', options = []) {
		return this.Query(options).findByFieldAndUserId(field, userId, coin);
	}

	validateValue (field, value, coin = 'xla') {
		if (!(coin in global.coins)) return false;

		switch (field) {
		case 'tip_submit':
		case 'rain_submit':
			if (!value || typeof value === 'undefined') {
				return 'disable';
			}

			value = value.toLowerCase();
			if (!~['enable', 'disable'].indexOf(value)) {
				return 'disable';
			}

			break;
		case 'tip':
		case 'rain':
			if (!value) {
				return global.coins[coin].settings[field];
			}
			value = parseInt(value) || 0;
			if (value === 0) {
				return global.coins[coin].settings[field];
			}
			const max = `${field}_max` in global.coins[coin].settings ? global.coins[coin].settings[`${field}_max`] : value;
			if (value > max) {
				return max;
			}
			const min = `${field}_min` in global.coins[coin].settings ? global.coins[coin].settings[`${field}_min`] : value;
			if (value < min) {
				return min;
			}
			break;
		case 'wet':
			if (!value) {
				return global.coins[coin].settings[field];
			}
			value = parseInt(value) || 0;
			if (value === 0) {
				return global.coins[coin].settings.wet;
			}
			const _max = 'wet_max' in global.coins[coin].settings ? global.coins[coin].settings.wet_max : 20;
			if (value > _max) {
				return _max;
			}

			const _min = 1;
			if (value < _min) {
				return _min;
			}
			break;
		default:
			return false;
		}

		return value;
	}
}

module.exports = Setting;
