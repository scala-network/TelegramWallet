

const Command = require('./BaseCommand');
const STATUS = require('../status');

class AddressCommand extends Command {

    get MaxWalletUser() {
        return 1;
    }

    enabled = true;

    get description() {
        return "Creates a wallet usages: /create <password>";
    }

    get name() {
        return "address";
    } 
    
    auth(request) {
        return !request.is.group;
    }

    async run(ctx) {
        if(ctx.test)  return;
        if(ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing argument for password\n${this.description}`);
        }
        const User = this.loadModel('User');
        const user = await User.createWithWallet(ctx.from.id, ctx.from.username, ctx.appRequest.args[0]);
        switch(user) {
            case STATUS.ERROR_WALLET_CREATE_EXCEED:
                return ctx.reply("Maximum wallet creation reached.");
            case STATUS.ERROR_REQUEST_PENDING:
                return ctx.reply("A request has already been made. Please wait."); 
            default:
                ctx.reply('Request queued: creating new wallet');

                // Queue.push({
                //     'from' : ctx.from,
                //     'chat' : ctx.chat,
                //     'message' : ctx.message,
                //     'request': ctx.appRequest,
                // }, () =>  ctx.reply('Request queued: create new wallet ended'));

        }

  

    }
	
}

module.exports = AddressCommand;
