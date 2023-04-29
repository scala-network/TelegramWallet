/**
 * APP Script
 * Observer for telegram events
 * @module APP
 */

require("./src/bootstrap");
const logSystem = "app";
const TimeAgo = require('javascript-time-ago');
TimeAgo.addDefaultLocale(require('javascript-time-ago/locale/en'));
const Telegraf = require('telegraf');
const sleep = (timer = 1) => {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timer * 1000);
	});
};
const bot = new Telegraf.Telegraf(global.config.bot.token);
    // We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then(async bot_informations => {
    // bot.options.username = bot_informations.username;
    global.config.bot.name = "@" + bot_informations.username;
    global.log('info', logSystem, "Server initialized");
    global.log('info', logSystem, "Bot Nick: %s", global.config.bot.name);
	let cursor = false;
	await global.redisClient.connect().catch(() => {});

	while (cursor !== 0) {
		const users = await global.redisClient.scan(cursor !== false ? cursor : 0, 'match', 'xla:Users:*', 'count', 100);
		for (const user of users[1]) {
			if (!user) continue;
			const user_id = await global.redisClient.hget(user,'user_id');
			if(!user_id) continue;
			await bot.telegram.sendMessage(user_id, `⭐️ <b>The Diardi elections are officially open!</b> ⭐️

<b>WHO CAN BECOME A NODE OPERATOR?</b>

🔹 Anyone can become a Diardi operator and play an active role within the network consensus of Scala
🔹 You must be able to own and operate a server with a public IP address
🔹 Here are the specifications for a Diardi node: 8 cores, 8 GB RAM, 64 GB of storage minimum
🔹 You must also commit to maintain and support your node over time

<b>HOW TO BECOME A NODE OPERATOR?</b>

🔹 To ensure that the Diardi operators applicants are also worthy Diardi operators, we will have staked elections
🔹 You need to send vXLA voting tokens to our elections application: https://election.scalaproject.io/
🔹 IMPORTANT: Use the remote node http://election-node.scalaproject.io:11812/ to send your vXLA tokens to your Deposit Address
🔹 The candidates with the most votes will be elected as Node operators (1 vote = 1 vXLA)
🔹 You can vote for yourself

<b>MORE DETAILS & SUPPORT</b>

🔹 Don't hesitate to ask questions here on Telegram.
🔹 Check our Medium article: https://medium.com/scala-network/diardi-elections-instructions-46f2bba73acb
🔹 Elections will end on November 14, 2022

Happy voting!  🚀`, {
	parse_mode: 'HTML'
}).then(()=>console.log("Message sent to " + user_id)).catch(e => console.log("Message failed for " + user_id));
			await sleep(0.25);
		}
		cursor = parseInt(users[0]);
	}       
});
bot.catch(e => global.log('error', logSystem, e));

// // Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));     

