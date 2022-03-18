const logSystem = "model/member";
const Model = require('../base/model');

class Market extends Model {

        get fields() {
                return [
                    "price",
                    "volume_24h",
                    "volume_change_24h",
                    "percent_change_1h",
                    "percent_change_24h",
                    "percent_change_7d",
                    "percent_change_30d",
                    "market_cap",
                    "market_cap_dominance",
                    "fully_diluted_market_cap",
                    "last_updated",
                ];
        };

        get className() {
                return 'market';
        }
	
        

}

module.exports = Market;