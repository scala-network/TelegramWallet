
const Command = require('./BaseCommand');
const STATUS = require('../status');
const logSystem = "command/address";
class CreateCommand extends Command {

    get MaxWalletUser() {
        return 1;
    }

    enabled = true;

    get description() {
        let o = "Creates a wallet";
        if(!global.config.swm) {
            o+=' usages: /create <password>';
        }
        return o;
    }

    get name() {
        return "address";
    } 
    
    auth(ctx) {
        return !ctx.appRequest.is.group;
    }

    async run(ctx) {
        if(ctx.test) return;

        if(!global.config.swm && ctx.appRequest.args.length <= 0) {
            return ctx.reply(`Missing argument for password\n${this.description}`);
        }

        const password = ctx.appRequest.args[0];
        const {id,username} = ctx.from;
        const User = this.loadModel('User');

        const user = await User.add(id, username);
        switch(user) {
            case STATUS.ERROR_ACCOUNT_EXISTS:
                return ctx.reply("Account already exists");
           case STATUS.ERROR_CREATE_ACCOUNT:
                return ctx.reply("Account creation failed");    
            default:
                let address;
                let heightOrWalletId;

                if(!global.config.swm) {
                    const a = await this.Coin.createWallet(ctx.from.id,password);
                    if('error' in a) {
                        return ctx.reply(a.error.message);    
                    }
                    
                    await this.Coin.openWallet(id, password);
                    let address = await this.Coin.getAddress(id);
                    address = address.result.address;

                    heightOrWalletId = await this.Coin.getHeight(id);
                    heightOrWalletId = height.result.height;

                    await this.Coin.closeWallet(id);

                } else {
                    const Address = this.loadModel('Address'); 
                    const index = await Address.findByUserId(id);
                    let result;
                    if(index) {
                      
                        result = await this.Coin.getAddress(id, index);

                        if(result) {
                            if('error' in result) {
                                await User.remove(id);

                                global.log("error",logSystem, "Getting old subaddress for %s at %s\n %s",[
                                    `${id}@${username}`,index, result.error.message
                                ]);

                                return ctx.reply(result.error.message);
                            }
                            global.log("info",logSystem, "Getting old subaddress for %s at %s\n",[
                                `${id}@${username}`,index
                            ]);
                            heightOrWalletId = index;
                            if(result.result.addresses.length > 0 ) {
                                address = result.result.addresses[0].address;
                            }
                        }
                    }
                    if(!address) {
                        global.log("warn",logSystem, "Create new subaddress for %s",[
                            `${id}@${username}`
                        ]);

                        result = await this.Coin.createSubAddress(id); 
                        if(!result) {
                            await User.remove(id);
                            return ctx.reply("Unable to create address for wallet");
                        }
                        if('error' in result) {
                            return ctx.reply(result.error.message);
                        }

                        heightOrWalletId = result.result.account_index;
                        address = result.result.address; 

                        await Address.add(id, heightOrWalletId);
                    }
                }

                const Wallet = this.loadModel('Wallet');
                await Wallet.addByUser(user, address, heightOrWalletId);

                const wallet = Wallet.findByUserId(id);
                if(wallet) {
                    return ctx.reply("Account created successfully");    
                }

                await User.remove(id);
                
                return ctx.reply("Account creation failed");    
                
        }
    }
	
}

module.exports = CreateCommand;
