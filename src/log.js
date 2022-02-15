 
const fs = require('fs');
const util = require('util');
const dateFormat = require('dateformat');
const clc = require('cli-color');

/**
 * Initialize log system
 **/
 
// Set CLI colors
var severityMap = {
    'info': clc.blue,
    'warn': clc.yellow,
    'error': clc.red
};

// Set severity levels
var severityLevels = ['info', 'warn', 'error'];


let logFileDisbled = !global.config.log.files || !global.config.log.files.enabled || false;

if(!logFileDisbled){
	
	// Set log directory
	var logDir = global.paths;
	
	// Create log directory if not exists
	if (!fs.existsSync(logDir)){
	    try {
	        fs.mkdirSync(logDir);
	    }
	    catch(e){
	        throw e;
	    }
	}
	
	/**
	 * Write log entries to file at specified flush interval
	 **/ 
	var pendingWrites = {};
	
	setInterval(function(){
	    for (var fileName in pendingWrites){
	        var data = pendingWrites[fileName];
	        fs.appendFile(fileName, data, function(err) {
	            if (err) {
	                console.log("Error writing log data to disk: %s", err);
	                callback(null, "Error writing data to disk");
	            }
	        });
	        delete pendingWrites[fileName];
	    }
	}, global.config.log.files.flushInterval * 1000);

}
/**
 * Add new log entry
 **/

global.log = function(severity, system, text, data){

	
    var logConsole =  severityLevels.indexOf(severity) >= severityLevels.indexOf(global.config.log.console.level);
    
    logFiles = (!logFileDisbled)? severityLevels.indexOf(severity) >= severityLevels.indexOf(global.config.log.files.level):false;
    if (!logConsole && !logFiles) {
    	return;
    }

    var time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    var formattedMessage = text;

    if (data) {
		if(!Array.isArray(data)) {
			data = [data];
		}
        data.unshift(text);
        formattedMessage = util.format.apply(null, data);
    }

    if (logConsole){
        if (global.config.log.console.colors){
        	if(process.env.workerType){
        		system+=' (' + process.env.workerType + ':'+process.env.forkId+')';	
        	}
            console.log(severityMap[severity](time) + clc.white.bold(' [' + system + '] ') + formattedMessage);
        }else{
            console.log(time + ' [' + system + '] ' + formattedMessage);
        }
    }


    if (logFiles) {
        var fileName = logDir + '/' + system + '_' + severity + '.log';
        var fileLine = time + ' ' + formattedMessage + '\n';
        pendingWrites[fileName] = (pendingWrites[fileName] || '') + fileLine;
    }
};
