const logSystem = "model/redis/member";
const STATUS = require('../../../status');
const Query = require('../../../base/query');


class Member  extends Query
{

	async addMember(chatID, memberID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		const result = await redisClient
		.multi()
		.zadd(ckey, Date.now(),memberID)
		.zcard(ckey)
		.exec();
		// We set to 11 so that if any of the top10 is sending the money we will get the 11th member
		if(result[1][1] > 11) {
			redisClient.zpopmin(ckey);
		}
	}

		
	async findByLast10(chatID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zrevrange(ckey,0,-1);
	}

	
}

module.exports = Member;