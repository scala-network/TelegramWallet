const Xla = require('./xla');
class Vxla extends Xla{

	get fullname () {
		return 'Scala Voting Chain';
	}

	get symbol () {
		return 'VXLA';
	}
}

module.exports = vxla;