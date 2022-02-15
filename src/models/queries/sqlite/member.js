const STATUS = require('../../../status');

const logSystem = "model/redis/member";
const Query = require('../../../base/query');


class Member  extends Query
{
	async addMember(chat_id, member_id) {
		
		const updated = Date.now();
		let sql = `INSERT INTO members (chat_id,member_id, updated) values (?,?,?)`;
		await global.sqlite.run(sql,[chat_id, member_id, updated]);
		
		let sql = `SELECT member_count FROM member_counts WHERE chat_id = ?`;
		const member_count =  await global.sqlite.get(sql,[chatID]);
		if(result == null) {
			let sql = `INSERT INTO member_counts (chat_id, member_count) values (?,?)`;
			await global.sqlite.run(sql,[chat_id, 1]);	
		} else {
			let sql = `UPDATE member_counts SET member_count=? WHERE chat_id=?`;
			await global.sqlite.run(sql,[member_count+1,chat_id]);	
		}

		return {
			chat_id,
			member_id,
			updated
		}
	}

	async updateInChatId(chat_id, member_id) {

		const exists =  await this.existInChatId(chatID,memberID);

		if(!exists) {
			return await this.addMember(chat_id, member_id);
		} 

		const updated = Date.now();

		let sql = `UPDATE members SET (updated=?) WHERE chat_id = ? AND member_id = ?`;
		await global.sqlite.run(sql,[
			updated, 
			chat_id,
			member_id
		]);
	
		return {
			chat_id,
			member_id,
			updated
		}
	}

	async existInChatId(chatID, memberID) {
		let sql = `SELECT updated FROM members WHERE chat_id = ? AND member_id = ?`;
		return (!(await global.sqlite.get(sql,[chatID, memberID]) == null));
	}

	async totalMembers(chatID) {
		let sql = `SELECT member_count FROM member_counts WHERE chat_id = ?`;
		const result =  await global.sqlite.get(sql,[chatID]);
		if(!result) {
			return 0;
		}

		return result.member_count;
	}


	async findAllByChatId(chatID, page, limit) {

		if(page <= 1){
			page = 1;
		}

		let sql = `SELECT * FROM members WHERE chat_id = ? ORDER BY member_id ASC LIMIT = ?,?`;

		let offset = page * limit;

		const result =  await global.sqlite.all(sql,[chatID, limit, offset]);
		
		return result;
	}

	async findByLast10(chatID) {
		let sql = `SELECT * FROM members WHERE chat_id = ? ORDER BY updated DESC LIMIT = 10`;
		const result =  await global.sqlite.all(sql,[chatID]);
		
		return result;
	}
}

module.exports = Member;