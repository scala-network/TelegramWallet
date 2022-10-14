'use strict';
const Model = require('../base/model');

class Market extends Model {
	get fields () {
		return [
			{
				title:"LOCALHOST",
				auth:'https://localhost.glancemy.com:1999/auth'
			},
			{
				title:'SCALA: ELECTION(TESTNET)',
				auth:'https://test-elections.scalaproject.io/auth'
			},
			{
				title:'SCALA: ELECTION',
				auth:'https://elections.scalaproject.io/auth'
			}
		];
	}

	get className () {
		return 'auth';
	}

}

module.exports = Market;
