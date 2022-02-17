const logSystem = "model/member";
const Model = require('../base/model');

class Member extends Model {

        get fields() {
                return [
                        "member_id",
                        "chat_id",
                        "updated",
                        "coin_id"
                ];
        };

        get className() {
                return 'member';
        }
	
        addMember(chatID, memberID, option) {
            return this.Query(option).addMember(chatID, memberID);
        }

        findByLast10(chatID, option) {
            return this.Query(option).findByLast10(chatID);
        }

}

module.exports = Member;