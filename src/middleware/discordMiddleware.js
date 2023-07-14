const Middleware = require('../base/middleware');
const logSystem = 'middleware/dsicord';
const Discord = require('discord.js'); 
const bridge = require('../utils/bridge');

class DiscordMiddleware extends Middleware {
	enabled = true;
	#_webhookClient = null;
	get webhookClient() {
		if(!this.#_webhookClient && global.config.discord && global.config.discord.urlToken) {
			global.log('info',logSystem, "Discord linked");
			this.#_webhookClient = new Discord.WebhookClient({ url: global.config.discord.urlToken});
		}

		return this.#_webhookClient;
	}
	get name () {
		return 'discord';
	}

	async run (ctx, next) {
		if (ctx.test) return;

		const chatID = ('chat' in ctx) && ('id' in ctx.chat) ? ctx.chat.id : 'private';

		if(!this.webhookClient || !global.config.discord.chatId || global.config.discord.chatId.indexOf(''+chatID) < 0){
			return await next(ctx);
		}
		next(ctx);

		if (!('message' in ctx.update)){
			return;
		}
		const message = ctx.update.message;

		if(!message) {
			return;
		}
		const profilePicture = await ctx.telegram.getUserProfilePhotos(message.from.id,0,1);
		let profilePictureUrl;
		if (profilePicture && profilePicture.total_count > 0 && profilePicture.photos ) {
			profilePictureUrl = await ctx.telegram.getFileLink(profilePicture.photos[0][0].file_id).catch(e => {
				global.log('error',logSystem, 'Error Fetching Profile Picture %j', [e]);
			});
			if(typeof profilePictureUrl != 'string' && 'href' in profilePictureUrl) {
				profilePictureUrl = profilePictureUrl.href;
			}
		} else {
			profilePictureUrl = "https://telegram.org/img/t_logo.png";
		}
		

		let username = `${message.from.first_name}`;
		if (message.from.last_name) {
			username += ` ${message.from.last_name}`;
		}
		if (message.from.username) {
			username += ` (@${message.from.username})`;
		}

	

		let text = "";
		let fileId;

		if (message.text) {
			text = message.text;
		}
		if (message.document || message.photo || message.sticker || message.voice) {
			if(message.caption) {
				text += message.caption;
			}
			// convert bold, italic & hyperlink Telegram text for Discord markdown
			if (message.caption_entities) {
				text += bridge.telegram2Discord(text, message.caption_entities);
			}
			if (message.document) {
				fileId = message.document.file_id;
			} else if (message.sticker) {
				fileId = message.sticker.file_id;
			} else if (message.photo) {
				// pick the last/largest picture in the list
				fileId = message.photo[message.photo.length - 1].file_id;
			} else if(message.voice) {
				fileId = message.voice.file_id;
			}
		} else if (message.entities) {
			text += bridge.telegram2Discord(text, message.entities);
		}

		if(!text && !fileId) return;

		if (text) {
			text = text.replace(/@everyone/g, "[EVERYONE]").replace(/@here/g, "[HERE]");
		}

		text = '\n' + text;
		
		const webhookOut = {
			username,
			content : text
		};

		if(profilePictureUrl) {
			webhookOut.avatarURL = profilePictureUrl;
		}

		webhookOut.content = text ? text : '';

		if (fileId) {
			const fileUrl = await ctx.telegram.getFileLink(fileId).catch(e => {
				global.log('error', 'Error getFileLink %s', [e.message]);
			});

			if(typeof fileUrl === 'string') {
				webhookOut.files = [fileUrl];
			} else if('href' in fileUrl) {
				webhookOut.files = [fileUrl.href];
			} else {
				global.log('error',logSystem, 'Unknown format %s', [fileUrl]);
			}
		}

		await this.webhookClient.send(webhookOut).catch(e => {
			global.log('error',logSystem, "Send text Error %j", [err]);
		});
	}
}

module.exports = DiscordMiddleware;
