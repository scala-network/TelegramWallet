const STATUS = require('../../../status');

const logSystem = "model/redis/member";
const Query = require('../BaseQuery');


class Member  extends Query
{
	async updateInChatId(chatID, memberID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zadd(ckey, new Date().getTime(),memberID);
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