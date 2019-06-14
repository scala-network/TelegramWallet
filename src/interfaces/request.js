const http = require('http')
const https = require('https')
const async = require('async');

const jsonRpcRequest = function(obj, set, callback) {
	const req = obj.request(set.options, function (res) {
// reject on bad status
        if (res.statusCode < 200 || res.statusCode >= 300) {
        	callback(new Error('statusCode=' + res.statusCode),false);
        	return;
        }
	    // cumulate data
        var body = [];
        res.setEncoding('utf8')

        res.on('data', function(chunk) {
            body.push(chunk);
        });
       
	    res.on('end', function () {
            try {
                body = JSON.parse(body);
            } catch(e) {
        		callback(e,false);
        		return;
            }
            if(body.error) {
            	callback(body.error,false);
        		return;

            }

			let fn = function() {};
			if(typeof callback !== typeof fn) {
				   console.trace(callback);	
				   console.log(set);
				   console.trace(typeof callback);	
		            callback(false,body);
			}

            callback(false,body);

        

	    });
        // resolve on end
    });
    // reject on request error
    req.on('error', function(err) {
        callback(err,false);
    });
    
    req.end(set.data);
};

const setup = (server,method,params,path) => {
	
	path = path || '/json_rpc';

	const data = {
		id: '0',
		jsonrpc: '2.0',
		method: method,
		params: params
	};

	const jsonData = JSON.stringify(data);

	const headers = {
		'Content-Length': jsonData.length,
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	return {
		options : {
		    hostname: server.host,
		    port: server.port,
		    path: path,
		    method: 'POST',
		    headers: headers
		},
		data : jsonData
	};

};

module.exports = {
	post: (server,method,params,callback,path) => {
		if (typeof params !== typeof {} && !callback) {
			callback = params;
			params = {};
		}
		const set = setup(server,method,params,path);
		const obj = (server.port === 443 || server.tls === true )? https : http;
		return jsonRpcRequest(obj,set,callback);
	}
}
