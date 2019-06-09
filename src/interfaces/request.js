
const axios = require('axios');

module.exports = {
	post: (c) => {
		return axios.post(c.url,c.jsonData, c.headers)
	},
	setup:(server,method,params,path) => {
	
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

		let scheme = (server.port === 443 || server.tls === true)?'https':'http';
		scheme+="://";

		const url = scheme+server.host+server.port+path;

		const request = {
			header:headers,
			data:data,
			json:jsonData,
			url:url
		};

		return request;
	}
}