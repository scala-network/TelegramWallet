
const { STATUS_CODES } = require('http');
const Command = require('../base/command');
const STATUS = require('../status');
const logSystem = "command/create";
const StartCommand = require('./startCommand');

class CreateCommand extends StartCommand {


    enabled =false;

    get description() {
        let o = "Creates a wallet";
        o += ' usages: /create';
        return o;
    }

    get name() {
        return "create";
    }

}

module.exports = CreateCommand;
