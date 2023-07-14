'use strict';
/**
* A Telegram Command. Chat allows to give a question and AI will answer it.
* To return talk to the ai use /chat <question?>
*
* @module Commands/address
*/
const Command = require('../base/command');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs').promises;
const moment = require('moment');

let in_talks = false;

class ChatCommand extends Command {
	get name () {
		return 'chat';
	}

	get description () {
		return 'Asks questions on scala to the bot';
	}

	auth (ctx) {
		return true;
	}
	#_knowledge = [];
	async run (ctx) {
		if (ctx.test || !global.config.openai) return;
		if(ctx.appRequest.args.length <= 0) {
			return ctx.appResponse.reply("Please provide a question for me to answer");
		}

		if(this.#_knowledge.length <= 0) {
			try{
				const json = await fs.readFile(process.cwd() + '/private/knowledge.json', 'utf8').catch(err => {
				    return null;
				 });
				const jsonData = JSON.parse(json);
				this.#_knowledge = jsonData.data;
			} catch(e) {

			}
		}

		let messages = [...this.#_knowledge];
		let greet = '';
		try{
			const chatScript = require('../utils/chat');
			const ai = await chatScript(ctx, messages, this);
			if(!ai) return;
			messages = ai.messages;
			greet = ai.greet;
		} catch(e) {
			console.log(e);
		}

		if(in_talks) {
				return ctx.appResponse.reply("Sorry "+ctx.appRequest.from.username +". Currently I am overloaded with other requests. You can retry your request " + moment.unix(in_talks).fromNow());
		}

		in_talks = moment().add(1,'minute').format('X');
		setTimeout(() => {
			in_talks = false;
		}, 60 * 1000);


		try {
			const configuration = new Configuration({
			   apiKey: global.config.openai.apiKey
			});
			const openai = new OpenAIApi(configuration);

		  const completion = await openai.createChatCompletion({
   			model:"gpt-3.5-turbo-0301",
	  			stream : false,
	  			messages
		  });
		  let response = completion.data.choices[0].message.content;
		  return ctx.appResponse.reply( greet +" "+ response);
		} catch (error) {
			let er;
		  	if (error.response) {
				    er = error.response.data.error.message;
				} else {
						er = error.message;
				}

				if(er.includes('Rate limit reach')) {
					er = 'Rate limit reached';
				}
				if(global.config.openai.admin) {
					ctx.appResponse.sendMessage(global.config.openai.admin,"Bot server error. Response : " +  er);
				}
				
		    return ctx.appResponse.reply("I am a bit busy right now.");
		}
	}
}
module.exports = ChatCommand;
