
class Status {
	static get NONE() {
		return 0;
	}
	static get OK() {
		return 1;
	}

	static get REQUEST_NEW_USER() {
		return 100;
	}

	static get WALLET_READY() {
		return 200;
	}

	static get ERROR_WALLET_CREATE_EXCEED() {
		return 400;
	}

	static get ERROR_REQUEST_PENDING() {
		return 401;
	}


}

module.exports = Status;