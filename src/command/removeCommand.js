const Command = require('../base/command');
const STATUS = require('../status');

class RemoveCommand extends Command {

    get description() {
        let o = "Deletes your account";
        if(!global.config.swm) {
            o+=' usages: /remove <password>';
        }
        return o;
    }

    get name() {
        return "remove";
    } 
    
    auth(ctx) {
        return !ctx.appRequest.is.group;
    }

    async run(ctx) {
        if(ctx.test) return;
       
        const User = this.loadModel('User');

        if(!(await User.exists(ctx.from.id))) {
            return ctx.appResponse.reply(`Account not avaliable`);    
        }
        await User.remove(ctx.from.id, ctx.from.username);
        /**
         * @@TODO : Delete wallet file for swm = false
        **/
        ctx.appResponse.reply("Account deleted");
    }
	
}

module.exports = RemoveCommand;
