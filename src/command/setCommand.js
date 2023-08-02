'use strict';
/**
 * A Telegram Command. Set value for your preference
 * usages: /set <config> <value>
 * Available configs:
 * - tip - Set tip amount
 * @module Commands/set
 */
const Command = require('../base/command');

class SetCommand extends Command {
	get name () {
		return 'set';
	}

	get description () {
		return 'Set value for coin config. Run /set for more details';
	}

	get fullDescription () {
		return `
Set value for your config. To get settings for a coin run /set coin only. usages: /set coin config value
\n<u><b>Configs avaliable</b></u>
<b>rain</b>
- Set amount of coin to distribute per head 
- usage: /set xla rain 10

<b>tip</b>
- Set default tip value 
- usage: /set xla tip 100

<b>tip_submit coin (enable | disable)</b>
- On enable tip will require a confirmation before sending (default: disable)
- usage: /set tip_submit xla disable

<b>rain_submit coin (enable | disable)</b>
- On enable rain will require a confirmation before sending (default: disable) 
- usage: /set rain_submit xla disable

<b>wet</b>
- Number of latest members to recieve rain
- usage: /set wet xla 10


Set value for your config. To get settings for user run /set user config. usages: /set user config value. Below are the avaliable
 configurations avaliable
<b>timezone</b>
- Set your current timezone. This is mandotary to allow OTP time is sync.
- To get the list of timezone refer to https://en.wikipedia.org/wiki/List_of_tz_database_time_zones (Please refer TZ Identifier)
- usage: /set user timezone Asia/Kuala_Lumpur`;
	}

	auth (ctx) {
		return !ctx.appRequest.is.group;
	}

	async run (ctx) {
		if (ctx.test) return;

		if (ctx.appRequest.args.length < 1) {
			return ctx.appResponse.reply(`Missing coin\n${this.fullDescription}`);
		}

		let coin = ('' + ctx.appRequest.args[0]).trim().toLowerCase();
		if (!coin) {
			coin = 'xla';
		}

		if(coin === 'user') {
			if (ctx.appRequest.args.length < 2) {
				let output = `<u>User Settings </u>\n`;
				const result = await Setting.findAllByUserId(ctx.from.id, coin);
				if(!result) {
					return ctx.appResponse.reply(`You haven't setup anything`);
				}
				for (const [k,v] of Object.entires(result)) {
					output += `<b>${k}</b> : ${v}\n`;
				}

				return ctx.appResponse.reply(output);
			}
			if (ctx.appRequest.args.length < 3) {
				return ctx.appResponse.reply('Missing new set value');
			}
			const field = ctx.appRequest.args[1];
			const value = ctx.appRequest.args[2];
			switch (field) {
			case 'timezone':
				if(!moment.tz.zone(value)) {
					return ctx.appResponse.reply('Invalid timezone. Please refer https://en.wikipedia.org/wiki/List_of_tz_database_time_zones');
				}
				await Setting.updateUser(ctx.from.id,field, value);
				return ctx.appResponse.reply(`Timezone saved ${value}`);
				break;
			default:
				break;
			}
			return;
		}


		if (!~global.config.coins.indexOf(coin)) {
			return ctx.appResponse.reply(`Invalid coin. Avaliable coins are ${global.config.coins.join(',')}`);
		}
		const coinObject = this.Coins.get(coin);

		const User = this.loadModel('User');
		const Setting = this.loadModel('Setting');

		const exists = await User.exists(ctx.from.id);

		if (!exists) {
			return ctx.appResponse.reply('User not avaliable run /start');
		}
		if (ctx.appRequest.args.length < 2) {
			let output = `<u>Coin Settings (${coinObject.fullname})</u>\n`;
			const result = await Setting.findAllByUserId(ctx.from.id, coin);
			for (const i in Setting.fields) {
				const field = Setting.fields[i];

				let out = Setting.validateValue(field, result[field], coin);
				switch (field) {
				case 'tip':
				case 'rain':
					out = coinObject.format(out);
					break;
				case 'wet':
					if (out === 1) { out += ' Member'; } else { out += ' Members'; }
					break;
				case 'tip_submit':
				case 'rain_submit':
				default:
					if (out === false) {
						out = 'disable';
					}
					break;
				}
				output += `<b>${field}</b> : ${out}\n`;
			}

			return ctx.appResponse.reply(output);
		}
		if (ctx.appRequest.args.length < 3) {
			return ctx.appResponse.reply('Missing new set value');
		}
		let status;
		const field = ctx.appRequest.args[1];
		switch (field) {
		case 'wet':
			const headCount = ctx.appRequest.args[2];

			const _headCount = Setting.validateValue('wet', headCount, coin);
			if (_headCount === false) {
				return ctx.appResponse.reply(`Unable to save ${coin} for ${field}`);
			}
			status = await Setting.updateField(ctx.from.id, field, _headCount, coin);

			if (!status) {
				return ctx.appResponse.reply(`Unable to save ${field} amount`);
			}

			return ctx.appResponse.reply(`Amount saved ${coin} for ${field} at ${_headCount}`);
		case 'rain':
		case 'tip':

			const amount = coinObject.parse(parseFloat(ctx.appRequest.args[2])); // From 10.00 to 1000
			const value = Setting.validateValue(field, amount, coin);

			if (value === false) {
				return ctx.appResponse.reply('Unable to validate field value');
			}

			status = await Setting.updateField(ctx.from.id, field, value, coin);

			if (!status) {
				return ctx.appResponse.reply(`Unable to save ${field} amount`);
			}

			return ctx.appResponse.reply(`Amount saved ${coin} for ${field} at ${coinObject.format(value)}`);

		case 'tip_submit':
		case 'rain_submit':
			let enabledDisabled = ctx.appRequest.args[2].toLowerCase();
			enabledDisabled = Setting.validateValue(field, enabledDisabled, coin);
			if (!enabledDisabled) {
				return ctx.appResponse.reply('Invalid value send enabled / disabled only');
			}
			status = await Setting.updateField(ctx.from.id, field, enabledDisabled, coin);

			if (!status) {
				return ctx.appResponse.reply('Unable to save submit enabled/disabled for '.field);
			}
			return ctx.appResponse.reply('Setting saved');
		default:
			return ctx.appResponse.reply('Invalid settings');
		}
	}
}

module.exports = SetCommand;
