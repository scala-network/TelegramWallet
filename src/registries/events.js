
const path = require('path');
const fs = require('fs');

const logSystem = "registries/events";

const eventCache = {};

module.exports = function (wallet, context) {

    const action = context.request.action;

    if(!eventCache.hasOwnProperty(action)) {
        const fileLoc = path.join(__dirname,'src','events', action + '.js');
    
        if(!fs.existsSync(fileLoc)){
            callback("Invalid event for events action " + action + 'at path :' + fileLoc);
            return;
        }

        eventCache[action] = require('./events/' +action);
    }

   if(!eventCache[action].hasOwnProperty('subscribe')){
        callback("Invalid subscribe request for events action " + action);
        return;
    }

    wallet.user_id = context.from.id;
    eventCache[context.request.action].subscribe(context, wallet, callback);

}
