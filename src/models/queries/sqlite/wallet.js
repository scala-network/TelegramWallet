const STATUS = require('../../../status');
const { v4: UUID } = require('uuid');
const Query = require('../../../base/query');
const Model = require('../../../base/model');

class Wallet  extends Query
{
	/**
	 * @name addByUser
	 * @description Add an address by a wallet index for a given user
	 * @param {object} user The user to be link for a wallet's address
	 * @param {string} address The subaddress the user's wallet account
	 * @param {number} wallet_id The subaddress index for a user's account
	 * @returns {object} Object presentation of wallet
	 * */
	async addByUser(user, address, wallet_id, height) {
		const wallet = {
			address,
			balance:0,
			user_id:user.id,
			updated:Date.now(),
			unlocked:0,
			status:STATUS.WALLET_READY,
			coin_id : global.config.coin,
			wallet_id,
			height: height
		};

		let rkey = Object.keys(wallet);
		let rq = Array(rkey.length).fill('?').join(',');

		let sql = `INSERT INTO wallets (${rkey.join(',')}) VALUES (${rq})`;

		await global.sqlite.run(sql,Object.values(wallet));

		return wallet;

	}

	/**
	 * @name updateByUserId
	 * @description Add an address by a wallet index for a given user
	 * @param {number} user_id The user context id
	 * @param {string} address The subaddress the user's wallet account
	 * @param {number} wallet_id The subaddress index for a user's account
	 * @returns {object} Object presentation of wallet
	 * */
	async updateByUserId(user_id) {

		let sql = `UPDATE wallets SET (updated=?,status=?) WHERE user_id = ? AND coin_id = ?`;
		await global.sqlite.run(sql, [
			Date.now(),
			STATUS.WALLET_READY,
			user_id, 
			global.config.coin
		]);

		return await global.sqlite.get(`SELECT * FROM wallets WHERE user_id = ? AND coin_id = ?`,[
			user_id, 
			global.config.coin
		]);

	}

	async update(wallet) {
		wallet = Object.assign(wallet, {
			// user_id: wallet.user_id,
			updated:Date.now(),
			status:STATUS.WALLET_READY
		});


		let sql = `UPDATE wallets SET (updated=?,status=?) WHERE user_id = ? AND wallet_id = ? AND coin_id = ?`;
		await global.sqlite.run(sql, [
			wallet.updated,
			wallet.status,
			wallet.user_id,
			wallet_id, 
			global.config.coin
		]);
		return await global.sqlite.get(`SELECT * FROM wallets WHERE user_id = ? AND wallet_id = ? AND coin_id = ?`,[
			wallet.user_id,
			wallet_id, 
			global.config.coin
		]);

	}

	async findByUserId(user_id) {

		let sql = `SELECT * FROM wallets WHERE user_id = ? AND coin_id = ?`;
		const result =  await global.sqlite.get(sql, [user_id, global.config.coin]);

		if(!result) {
        	return null;
		} 
		
		return result;
	}

}

module.exports = Wallet;

