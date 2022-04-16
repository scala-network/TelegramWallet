/**
 * A Telegram Command. Set value for your preference
 * usages: /set <config> <value>
 * Available configs:
 * - tip - Set tip amount
 * @module Commands/set
 */
const Command = require('../base/command');
const STATUS = require('../status');
const { Markup } = require('telegraf');

class SetCommand extends Command {

	get name() {
		return "set";
	}

	get description() {
		return `
Set value for your config. usages: /set <config> <value>
**Configs avaliable**
rain - Set amount of coin to distribute per head (usages: /set rain 10)(min: 1)
tip - Set default tip value (usages: /set tip 100)(default: 10)
tip_submit - (enable | disable). On enable tip will automatically be sent without confirmatio (default: disable)
rain_submit - (enable | disable). On enable rain will automatically be sent without confirmation (default: disable)
rain_max - Number of latest members to recieve rain (default: 20) (max : 20 | min: 1)`;
	}

	auth(ctx) {
		return !ctx.appRequest.is.group;
	}

	async run(ctx) {
		if (ctx.test) return;

		if (ctx.appRequest.args.length <= 1) {
			
			// return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
			return ctx.appResponse.reply(`Missing arguments\n${this.description}`);
		}

		const User = this.loadModel("User");
		const Setting = this.loadModel("Setting");

		const exists = await User.exists(ctx.from.id);

		if (!exists) {
			return ctx.appResponse.reply("User and wallet not avaliable please /create");
		}
		let status;
		const field = ctx.appRequest.args[0];
		switch (field) {
			case 'rain_max':
				const headCount = ctx.appRequest.args[1];
				const min_value = global.config.commands.rain_min || 1;
				
				if(min_value === false) {
					return ctx.appResponse.reply(`Unable to validate field value`);
				}
				if (min_value > headCount) {
					return ctx.appResponse.reply(`Unable to save ${field} amount lower than ${min_value}`);
				}

				const max_value = Setting.validateValue('rain_max', headCount);
				
				if(max_value === false) {
					return ctx.appResponse.reply(`Unable to validate field value`);
				}


				if (max_value < headCount) {
					return ctx.appResponse.reply(`Unable to save ${field} amount higher than ${max_value}`);
				}

				status = await Setting.updateField(ctx.from.id, field, headCount);

				if (status !== STATUS.OK) {
					return ctx.appResponse.reply(`Unable to save ${field} amount`);
				}

				return ctx.appResponse.reply(`Amount saved for ${field}`);
			case 'rain':
			case 'tip':
				const amount = this.Coin.parse(parseFloat(ctx.appRequest.args[1])); //From 10.00 to 1000
				const value = Setting.validateValue(field, amount);
				
				if(value === false) {
					return ctx.appResponse.reply(`Unable to validate field value`);
				}
				if (value > amount) {
					return ctx.appResponse.reply(`Unable to save ${field} amount lower than ${value}`);
				}

				status = await Setting.updateField(ctx.from.id, field, value);

				if (status !== STATUS.OK) {
					return ctx.appResponse.reply(`Unable to save ${field} amount`);
				}

				return ctx.appResponse.reply(`Amount saved for ${field}`);

			case 'tip_submit':
			case 'rain_submit':
				let enabledDisabled = ctx.appRequest.args[1].toLowerCase();
				enabledDisabled = Setting.validateValue(field, enabledDisabled);
				if (!enabledDisabled) {
					return ctx.appResponse.reply("Invalid value send enabled / disabled only");
				}
				status = await Setting.updateField(ctx.from.id, field, enabledDisabled);

				if (status !== STATUS.OK) {
					return ctx.appResponse.reply("Unable to save submit enabled/disabled for " . field);
				}
				return ctx.appResponse.reply("Setting saved");
			default:
				return ctx.appResponse.reply("Invalid settings");
		}
	}
}
module.exports = SetCommand;
