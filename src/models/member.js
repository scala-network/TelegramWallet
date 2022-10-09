'use strict';
const Model = require('../base/model');

class Member extends Model {
	get fields () {
		return [
			'member_id',
			'chat_id',
			'updated',
			'coin_id'
		];
	}

	get className () {
		return 'member';
	}

	async addMember (chatID, memberID, option) {
		return await this.Query(option).addMember(chatID, memberID);
	}

	async findByLast10 (chatID, option) {
		return await this.Query(option).findByLast10(chatID);
	}

	async findWet (chatID,coin, option) {
		return await this.Query(option).findWet(chatID,coin);
	}

	async addWet (chatID, username, amount,coin, option) {
		return await this.Query(option).addWet(chatID, username, amount,coin);
	}

	async findNimbus (chatID, coin, option) {
		return await this.Query(option).findNimbus(chatID, coin);
	}

	async addNimbus (chatID, username, amount,coin, option) {
		return await this.Query(option).addNimbus(chatID, username, amount,coin);
	}
}

module.exports = Member;
