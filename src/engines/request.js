// Load required modules

const logSystem = 'engine/request';

const http = require('http');
const https = require('https');

function jsonHttpRequest (host, port, data, path, callback) {
	path = path || '/json_rpc';
	callback = callback || function () {};
	const options = {
		hostname: host,
		port: port,
		path: path,
		method: data ? 'POST' : 'GET',
		headers: {
			connection: 'keep-alive',
			'Content-Length': data.length,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		}
	};
	const req = (port === 443 ? https : http)
		.request(options, function (res) {
			let replyData = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				replyData += chunk;
			});
			res.on('end', function () {
				let replyJson;
				try {
					replyJson = replyData ? JSON.parse(replyData) : {};
				} catch (e) {
					callback(e, {});
					return;
				}
				callback(null, replyJson);
			});
		});

	req.on('error', function (e) {
		callback(e, {});
	});

	req.end(data);
}

/**
 * Send RPC request
 **/
function rpc (host, port, id, method, params, path, callback) {
	id = id || 0;
	const data = JSON.stringify({
		id: `${id}`,
		jsonrpc: '2.0',
		method: method,
		params: params
	});
	jsonHttpRequest(host, port, data, path, function (error, replyJson) {
		if (error) {
			global.log('error', logSystem, 'Error %j', [error]);
			callback(error, {});
			return;
		}

		callback(null, replyJson);
	});
}

module.exports = {
	rpc,
	fetch: (host, port, id, method, params) => {
		return new Promise((resolve, reject) => {
			rpc(host, port, id, method, params, null, (err, data) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(data);
			});
		}).catch(e => global.log('error', logSystem, 'RPC Error %j', [e]));
	}

};
