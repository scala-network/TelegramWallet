
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
        return !ctx.appRequest.is.group;
    }

    async run(ctx) {
        if (ctx.test) return;

        const { id, username } = ctx.from;
        const User = this.loadModel('User');
        const Wallet = this.loadModel('Wallet');

        const user = await User.add(id, username);

        let wallet;
        switch (user) {
            case STATUS.ERROR_ACCOUNT_EXISTS:
                wallet = await Wallet.findByUserId(user.user_id);
                return ctx.reply(`Hello ${username}. Welcome back!`);
            case STATUS.ERROR_CREATE_ACCOUNT:
                return ctx.reply("Account start failed");
            default:
                wallet = await Wallet.findByUserId(user.user_id);
                
                let address;
                let wallet_id;
                if(wallet) {
                    address = wallet.address;
                    wallet_id = wallet.wallet_id;
                }

                let result;

                if (user.status === STATUS.WALLET_REQUIRED || !wallet_id) {

                    result = await this.Coin.createSubAddress(user.user_id);

                    if (!result) {
                        // await User.remove(id);
                        return ctx.reply("Unable to create address for wallet");
                    }

                    if ('error' in result) {
                        return ctx.reply(result.error.message);
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

                            return ctx.reply(result.error.message);
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

                if (!wallet || user.status === STATUS.WALLET_REQUIRED) {
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
                    wallet = await Wallet.update(wallet);                    
                }


                if (wallet) {
                    return ctx.reply("Account created successfully");
                }
                await User.remove(id);

                return ctx.reply("Account creation failed");

        }
    }

}

module.exports = StartCommand;
