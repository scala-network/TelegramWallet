
const Coin = require('../coins/xla');;
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
        const coin = new Coin();

        if(ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing argument for password\n${this.description}`);
        }
        const password = ctx.appRequest.args[0];
        const {id,username} = ctx.from;
        const User = this.loadModel('User');
        const user = await User.createWithWallet(id, username, password);
        

        switch(user) {
            case STATUS.ERROR_WALLET_CREATE_EXCEED:
                return ctx.reply("Maximum wallet creation reached.");
            case STATUS.ERROR_REQUEST_PENDING:
                return ctx.reply("A request has already been made. Please wait."); 
            default:
                const a = await coin.createWallet(ctx.from.id,password);
                if(a.error) {
                    return ctx.reply(a.error.message);    
                }
                
                await coin.openWallet(id, password);
                let address = await coin.getAddress(id);
                address = address.result.address;

                let height = await coin.getHeight(id);
                height = height.result.height;

                await coin.closeWallet(id);

                const Wallet = this.loadModel('Wallet');
                
                const wallet = Wallet.addWalletByUserId(id,address,height);

                ctx.reply("Account created successfully");
                

        }

  

    }
	
}

module.exports = AddressCommand;
