const Middleware = require('../base/middleware');
const logSystem = "middleware/log";
const { REST } = require('@discordjs/rest');
const rest = new REST({ version: '9' }).setToken(global.config.discord.token);

const discordCommands = [{
      name: 'ping',
    description: 'Replies with Pong!'
}];
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(global.config.discord.clientId, global.config.discord.guildId),
      { body: discordCommands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const { Client, Intents } = require('discord.js');
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });
discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});
discordClient.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});
discordClient.login(global.config.discord.token);

class DiscordMiddleware extends Middleware {
    enabled = true;

    get name() {
        return "discord";
    }

    async run(ctx, next) {
        if(ctx.test)  return;

        if(!ctx || !ctx.appRequest || !ctx.appRequest.is.action || !ctx.from.username){
            return next(ctx);
        }

        
        bot2.channels.get(channelid).send("[Telegram] **" + msg.from.first_name + " (@" + msg.from.username + "):** " + msg.text);


       
    }

}


module.exports = DiscordMiddleware;
