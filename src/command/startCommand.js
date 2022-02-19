
const Command = require('../base/command');
const STATUS = require('../status');
const utils = require('../utils');

const logSystem = "command/start";

class StartCommand extends Command {

    enabled = true;

    get description() {
        let o = "Function on start";
        if (!global.config.swm) {
            o += ' usages: /start';
        }
        return o;
    }

    get name() {
        return "start";
    }

    auth(ctx) {
        return !ctx.appRequest.is.group && ctx.appRequest.is.action;
    }

    async run(ctx) {
        if (ctx.test) return;

        const { id, username } = ctx.from;
        const User = this.loadModel('User');
        const Wallet = this.loadModel('Wallet');
        if(!username) {
           return ctx.send("To create an account user must have username"); 
        }

        const user = await User.add(id, username);
        
        let wallet;
        switch (user) {
            case STATUS.ERROR_ACCOUNT_EXISTS:
                return ctx.appResponse.reply(`Hello ${username}. Welcome back!`);
            case STATUS.ERROR_CREATE_ACCOUNT:
                await User.remove(id, username);
                return ctx.appResponse.reply("Error creating account");
            default:
                if(user && parseInt(user.user_id) !== id) {
                    await User.remove(id, username);
                    return ctx.appResponse.reply("Account created failed");
                }
                if(!user.wallet) {
                    wallet = await Wallet.findByUserId(user.user_id);    
                } else {
                    wallet = user.wallet;
                }
                
                
                let address;
                let wallet_id;
                if(wallet) {
                    address = wallet.address;
                    wallet_id = wallet.wallet_id;
                } else {
                    wallet_id = user.wallet_id;
                }

                let result;

                if (user.status === STATUS.WALLET_REQUIRED || !wallet_id) {

                    result = await this.Coin.createSubAddress(user.user_id);

                    if (!result) {
                        // await User.remove(id);
                        return ctx.appResponse.reply("Unable to create address for wallet");
                    }

                    if ('error' in result) {
                        return ctx.appResponse.reply(result.error);
                    }

                    wallet_id = result.account_index;
                    address = result.address;

                    global.log("info", logSystem, "Create new subaddress for \n\t\t=> %s\n\t\t=> %s", [
                        `${user.user_id}@${username}`,
                        `${address.slice(0, 5)}...${address.slice(address.length-5)} : ${wallet_id}`
                    ]);
                }

                if (!address && wallet_id) {

                    result = await this.Coin.getAddress(user.user_id, wallet_id);
                    if (result) {
                        if ('error' in result) {
                            global.log("error", logSystem, "Getting old subaddress for %s at %s\n %s", [
                                `${user.user_id}@${username}`, wallet_id, result.error.message
                            ]);

                            return ctx.appResponse.reply(result.error.message);
                        }

                        if (result.addresses.length > 0) {
                            address = result.addresses[0].address;
                        }

                        global.log("info", logSystem, "Create old subaddress for \n\t\t=> %s\n\t\t=> %s", [
                            `${user.user_id}@${username}`,
                            `${address.slice(0, 5)}...${address.slice(address.length-5)} : ${wallet_id}`
                        ]);
                    }
                }

                if (user.status === STATUS.WALLET_REQUIRED && address && wallet_id) {
                    const Network = this.loadModel('Network');

                    const network = Network.lastHeight(this.Coin);
                    let height;
                    if(!network || !network.height) {
                        height = 0;
                    }
                    wallet = await Wallet.addByUser(user, address, wallet_id, height);
                    
                } else if(
                    (!wallet_id && wallet.wallet_id !== wallet_id) || 
                    (!address && wallet.address !== address)
                ) {
                    wallet = await Wallet.update(user_id, wallet);                    
                }


                if (wallet) {
                    return ctx.appResponse.reply("Account created successfully");
                }
                await User.remove(id, username);

                return ctx.appResponse.reply("Account creation failed");

        }
    }

}

module.exports = StartCommand;
