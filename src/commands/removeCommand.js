

const Command = require('./BaseCommand');
const STATUS = require('../status');

class RemoveCommand extends Command {

    enabled = true;

    get description() {
        return "Deletes your account usages: /remove <password>";
    }

    get name() {
        return "remove";
    } 
    
    auth(request) {
        return !request.is.group;
    }

    async run(ctx) {
        if(ctx.test)  return;
        // if(ctx.appRequest.args.length <= 0) {
        //     return ctx.reply(`Missing argument for password\n${this.description}`);
        // }
        const User = this.loadModel('User');
        const user = await User.remove(ctx.from.id, ctx.from.username
            //, ctx.appRequest.args[0]
        );
        
        ctx.reply("Account deleted");
  

    }
	
}

module.exports = RemoveCommand;
