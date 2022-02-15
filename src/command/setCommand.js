/**
 * A Telegram Command. Set value for your preference
 * usages: /set <config> <value>
 * Available configs:
 * - tip - Set tip amount
 * @module Commands/set
 */
const Command = require('../base/command');
const STATUS = require('../status');

class SetCommand extends Command {
	enabled = true;

	get name() {
		return "set";
	}

	get description() {
		return `
Set value for your config. usages: /set <config> <value>
**Configs avaliable**
rain - Set default rain value (usages: /set rain 10)
tip - Set default tip value (usages: /set tip 100)
tip_submit - (enabled | disabled). On enable tip will automatically be sent without confirmation via /submit (default: disabled)
rain_submit - (enabled | disabled). On enable rain will automatically be sent without confirmation via /submit (default: disabled)`;
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if (ctx.test) return;

		if (ctx.appRequest.args.length <= 1) {
			return ctx.reply(`Missing arguments\n${this.description}`);
		}

		const User = this.loadModel("User");
		const Setting = this.loadModel("Setting");

		const exists = await User.exists(ctx.from.id);

		if (!exists) {
			return ctx.reply("User and wallet not avaliable please /create");
		}
		let status;
		const field = ctx.appRequest.args[0];
		switch (field) {
			case 'rain':
			case 'tip':
				const amount = this.Coin.parse(parseFloat(ctx.appRequest.args[1])); //From 10.00 to 1000
				const value = Setting.validateValue(field, amount);
				
				if(value === false) {
					return ctx.reply(`Unable to validate field value`);
				}
				if (value > amount) {
					return ctx.reply(`Unable to save ${field} amount lower than value`);
				}

				status = await Setting.updateField(ctx.from.id, field, value);

				if (status !== STATUS.OK) {
					return ctx.reply(`Unable to save ${field} amount`);
				}

				return ctx.reply(`Amount saved for ${field}`);

			case 'tip_submit':
			case 'rain_submit':
				let enabledDisabled = ctx.appRequest.args[1].toLowerCase();
				enabledDisabled = Setting.validateValue(field. enabledDisabled);
				if (enabledDisabled === false) {
					return ctx.reply("Invalid value send enabled / disabled only");
				}
				status = await Setting.updateField(ctx.from.id, field, enabledDisabled);

				if (status !== STATUS.OK) {
					return ctx.reply("Unable to save submit enabled/disabled for " . field);
				}
				return ctx.reply("Setting saved");
			default:
				return ctx.reply("Invalid settings");
		}
	}
}
module.exports = SetCommand;
