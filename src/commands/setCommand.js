/**
 * A Telegram Command. Set value for your preference
 * usages: /set <config> <value>
 * Available configs:
 * - tip - Set tip amount
 * @module Commands/set
 */
const Command = require('./BaseCommand');

class SetCommand extends Command {
	enabled = true;

	get name() {
        return "set";
    }
	
	get description() {
		return `Set value for your config. (usages: /set <config> <value>
		Configs avaliable:
		tip - Set default tip value (usages: /set tip 100)
		`;
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if(ctx.test)  return;
		
		if(ctx.appRequest.args.length <= 1) {
            return ctx.reply(`Missing arguments\n${this.description}`);
        }

		const User = this.loadModel("User");

		const result = await User.findAllById(ctx.from.id);
		if (!result) {
			return ctx.reply("User and wallet not avaliable please /create");
		}

		switch(ctx.appRequest.args[0]) {
			case 'tip':
			const amount = parseFloat(ctx.appRequest.args[1]);
			const minTip = global.config.commands.tip;
			if(amount <= minTip) {
				return ctx.reply(`Unable to set tip amount lower than ${minTip} ${this.Coin.symbol}`);
			}
			const status = await User.updateField("tip",,this.Coin.parse(amount));
			if(status !== STATUS.OK) {
				return ctx.reply("Unable to save tip amount");
			}
			return ctx.reply("Tip amount saved");
			default:
			return ctx.reply("Invalid settings");
		}
	}
}
module.exports = SetCommand;
