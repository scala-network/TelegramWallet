const path = require('path');
const fs = require('fs');
const logSystem = 'bootstrap';

const redis = require('redis');
let config = {};

const configFile =  path.join(process.cwd(),'config.json');

try {

    const rfs = fs.readFileSync(configFile);
    const rawJson = JSON.parse(rfs);
    const defJson = require('./defaults/config');
	global.config = Object.assign(defJson, rawJson);

} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}

require('./log');
/* ENGINES DEFAULT */
const rawDBJson = require('./defaults/engine');

global.config['datasource'] = Object.assign(rawDBJson, global.config.datasource);
/* COMMANDS SETUP DEFAULT */
const rawCommandJson = require('./defaults/commands');

global.config['commands'] = Object.assign(rawCommandJson, global.config.commands);


switch(global.config.datasource.engine) {
    case "redis":
        global.redisClient = require('./engines/redis')(global.config.datasource);
        break;
    case "redis":
        require('./engines/sqlite');
        break;
}


