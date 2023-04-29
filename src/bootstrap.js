'use strict';
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const configFile = path.join(process.cwd(), 'config.json');

try {
	const rfs = fs.readFileSync(configFile);
	const rawJson = JSON.parse(rfs);
	const defJson = require('./defaults/config');
	global.config = _.merge(defJson, rawJson);
	// const marConfig = require('./defaults/market');
	// global.config = _.merge({ market: marConfig }, defConfig);
} catch (e) {
	console.error('Failed to read config file ' + configFile + '\n\n' + e);
	process.exit();
}
require('./log');
/* ENGINES DEFAULT */
// const rawDBJson = require('./defaults/engine');

// global.config.datasource = _.merge(rawDBJson, global.config.datasource);
/* COMMANDS SETUP DEFAULT */
const rawCommandJson = require('./defaults/commands');

global.config.commands = _.merge(rawCommandJson, global.config.commands);

for (const [engine, dsConfig] of Object.entries(global.config.datasource)) {
	switch (engine) {
	case 'redis':
		global.redisClient = require('./engines/redis')(dsConfig);
		break;
	default:
		break;
	}
}

global.coins = {};
for (const coin of global.config.coins) {
	global.coins[coin] = require('../config/' + coin);
}
