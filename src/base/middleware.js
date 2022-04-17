class Middleware {
	enabled = false;

	constructor () {
		if (!this.name) {
			console.error('Method missing name');
			process.exit();
		}

		try {
			this.run({ test: true });
		} catch (e) {
			console.error('Method missing run');
			process.exit();
		}
	}
}

module.exports = Middleware;
