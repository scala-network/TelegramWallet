const Command = require('./BaseCommand');
const STATUS = require('../status');

class TransferCommand extends Command {

    enabled = true;

    get description() {
        return "Deletes your account usages: /remove <password>";
    }

    get name() {
        return "remove";
    } 
    
    auth(ctx) {
        return !ctx.appRequest.is.group;
    }

    async run(ctx) {
        if(ctx.test)  return;
        if(ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing argument for password\n${this.description}`);
        }
        const User = this.loadModel('User');
        if(!user) {
            return ctx.reply(`Account not avaliable`);    
        }
        await User.remove(ctx.from.id, ctx.from.username);
        /**
         * @@TODO : Delete wallet file
         **/
        ctx.reply("Account deleted");
  

    }
	
}

module.exports = TransferCommand;
