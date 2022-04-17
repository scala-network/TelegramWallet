'use strict';
const fs = require('fs');
const util = require('util');
const dateFormat = require('dateformat');
const clc = require('cli-color');

/**
 * Initialize log system
 **/

// Set CLI colors
const severityMap = {
	info: clc.blue,
	warn: clc.yellow,
	error: clc.red
};

// Set severity levels
const severityLevels = ['info', 'warn', 'error'];

const logFileDisbled = !global.config.log.files || !global.config.log.files.enabled || false;
let logDir;
/**
* Write log entries to file at specified flush interval
**/
const pendingWrites = {};

if (!logFileDisbled) {
	// Set log directory
	logDir = global.config.log.files.path;

	// Create log directory if not exists
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir);
	}

	setInterval(function () {
		for (const fileName in pendingWrites) {
			const data = pendingWrites[fileName];
			fs.appendFile(fileName, data, function (err) {
				if (err) {
					console.log('Error writing log data to disk: %s', err);
					// callback(null, 'Error writing data to disk');
				}
			});
			delete pendingWrites[fileName];
		}
	}, global.config.log.files.flushInterval * 1000);
}
/**
 * Add new log entry
 **/

global.log = function (severity, system, text, data) {
	const logConsole = severityLevels.indexOf(severity) >= severityLevels.indexOf(global.config.log.console.level);

	const logFiles = (!logFileDisbled) ? severityLevels.indexOf(severity) >= severityLevels.indexOf(global.config.log.files.level) : false;
	if (!logConsole && !logFiles) {
		return;
	}

	const time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
	let formattedMessage = text;

	if (data) {
		if (!Array.isArray(data)) {
			data = [data];
		}
		data.unshift(text);
		formattedMessage = util.format.apply(null, data);
	}

	if (logConsole) {
		if (global.config.log.console.colors) {
			if (process.env.forkId >= 0) {
				system += ' (' + process.env.forkId + ')';
			}
			console.log(severityMap[severity](time) + clc.white.bold(' [' + system + '] ') + formattedMessage);
		} else {
			console.log(time + ' [' + system + '] ' + formattedMessage);
		}
	}

	if (logFiles) {
		const fileName = logDir + '/' + system + '_' + severity + '.log';
		const fileLine = time + ' ' + formattedMessage + '\n';
		pendingWrites[fileName] = (pendingWrites[fileName] || '') + fileLine;
	}
};
