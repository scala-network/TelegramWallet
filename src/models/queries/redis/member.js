const logSystem = "model/redis/member";
const STATUS = require('../../../status');
const Query = require('../../../base/query');
const Model = require('../../../base/model');


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
		if(result[1][1] > 22) {
			redisClient.zpopmin(ckey);
		}
	}

		
	async findByLast10(chatID) {
		const ckey = [global.config.coin,"GroupMembers", chatID].join(":");
		return await redisClient.zrevrange(ckey,0,-1);
	}

	async findWet(chatID) {
		const dateObj = new Date();
	    const month = String(dateObj.getMonth()).padStart(2, '0');
	    const day = String(dateObj.getDate()).padStart(2, '0');
	    const year = dateObj.getFullYear();

	    const dateKey = year + month + day;
		const ckey1 = [global.config.coin,"GroupWettest:overall", chatID].join(":");
		const ckey2 = [global.config.coin,"GroupWettest:" + dateKey, chatID].join(":");		

		const results = await redisClient
		.multi()
		.zrevrange(ckey1,0,-1, "WITHSCORES")
		.zrevrange(ckey2,0,-1, "WITHSCORES")
		.exec();
		const overall = [];
		const today = [];
		if(results[0][1] && results[0][1].length > 0) {
			for(let i =0;i< results[0][1].length;i+=2) {
				const username = results[0][1][i];
				const amount = results[0][1][i+1];
				
				overall.push({
					amount,
					username
				});

				if(overall.length > 10) {
					break;
				}
			}	
		}
		if(results[1][1] && results[1][1].length > 0) {

			for(let i =0;i< results[1][1].length;i+=2) {
				const username = results[1][1][i];
				const amount = results[1][1][i+1];
				
				today.push({
					amount,
					username
				});

				if(today.length > 10) {
					break;
				}
			}	
		}
		
		return {overall,today};
	}

	async addWet(chatID, username, amount) {
		const dateObj = new Date();
	    const month = String(dateObj.getMonth()).padStart(2, '0');
	    const day = String(dateObj.getDate()).padStart(2, '0');
	    const year = dateObj.getFullYear();
		const dateKey = year + month + day;
		const ckey1 = [global.config.coin,"GroupWettest:overall", chatID].join(":");
		const ckey2 = [global.config.coin,"GroupWettest:" + dateKey, chatID].join(":");		
		const result = await redisClient
		.multi()
		.zincrby(ckey1, amount, username)
		.zincrby(ckey2, amount, username)
		.exec();
		// We set to 11 so that if any of the top10 is sending the money we will get the 11th member
	}

	
}

module.exports = Member;