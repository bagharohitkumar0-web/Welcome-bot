const { Client, GatewayIntentBits } = require('discord.js');const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
  const channel = member.guild.channels.cache.get('1128795556272533514');
  if (channel) {
    channel.send(`Welcome ${member.user} 🍃 ━━━━━━━━━━━━━━━━━━━━━━━━━━ 🍃
Welcome to the Forest, <@user>! 🍄

Humare cozy community garden mein aapka swaagat hai! ✨

🌷 ┆ **https://discord.com/channels/1478807406724120658/1478807408342995098
🌿 ┆ **https://discord.com/channels/1478807406724120658/1478807408867414171
🌸 ┆ https://discord.com/channels/1478807406724120658/1478807408342995099

Chill karo, music suno aur naye dosto se milo! 🎧💖
🍃 ━━━━━━━━━━━━━━━━━━━━━━━━🍃`);
  }
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply('Pong! 🏓');
  }
});

client.login(process.env.DISCORD_TOKEN);
