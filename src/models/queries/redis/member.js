const logSystem = "model/redis/member";
const STATUS = require('../../../status');
const Query = require('../../../base/query');


class Member  extends Query
{

	async addMember(chatID, memberID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zadd(ckey, new Date().getTime(),memberID);
	}

	async updateInChatId(chatID, memberID) {
		return await this.addMember(chatID, memberID);
	}

	async existInChatId(chatID, memberID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zscore(ckey, memberID) || false;

	}

	async totalMembers(chatID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zcard(ckey) || 0;

	}


	async findAllByChatId(chatID, page, limit) {
		limit = limit || 10;
		
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");

		if(typeof page == 'undefined' ) {
			page = 1;
		}

		if(page < 0) {
			return await redisClient.zrevrangebyscore([ckey, "+inf", 0, 'BYSCORE']);
		}

		return await redisClient.zrevrangebyscore([ckey, "+inf", 0, 'BYSCORE', 'LIMIT', page, limit]);

	}
}

module.exports = Member;