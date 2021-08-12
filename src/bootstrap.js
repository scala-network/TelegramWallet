const path = require('path');
const fs = require('fs');
const logSystem = 'bootstrap';

const redis = require('redis');
let config = {};

const configFile =  path.join(process.cwd(),'config.json');

try {

    const rfs = fs.readFileSync(configFile);

	global.config = Object.assign(require('./default'), JSON.parse(rfs));

} catch(e){
    console.error('Failed to read config file ' + configFile + '\n\n' + e);
    process.exit();
}


global.coin = require('./coins/' + global.config.coin);

require('./interfaces/redis');

require('./log');
