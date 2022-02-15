
class Status {
	static get NONE() {
		return 0;
	}
	static get OK() {
		return 1;
	}

	/* 100-199 : request status */
	static get REQUEST_NEW_USER() {
		return 100;
	}

	/* 200-299 : wallet status */
	static get WALLET_READY() {
		return 200;
	}

	static get WALLET_REQUIRED() {
		return 201;
	}

	

	/* 400-4299 : error status */
	static get ERROR_WALLET_CREATE_EXCEED() {
		return 400;
	}

	static get ERROR_REQUEST_PENDING() {
		return 401;
	}

	static get ERROR_ACCOUNT_EXISTS() {
		return 402;
	}

	static get ERROR_CREATE_ACCOUNT() {
		return 403;
	}

	static get ERROR_ACCOUNT_NOT_EXISTS() {
		return 404;
	}

	static get ERROR_MODEL_PROPERTIES_NOT_AVALIABLE() {
		return 405;
	}

	static get ERROR_MODEL_UPDATE() {
		return 406;
	}

	static get ERROR_WALLET_NOT_AVALIABLE() {
		return 406;
	}
	static get ERROR_FETCHED_DAEMON() {
		return 406;
	}
}

module.exports = Status;