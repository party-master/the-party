const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('The re-education chamber is warmed up!');
});

client.on('message', message => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === `server-info`) {
        client.commands.get('!server-info').execute(message, args);

    } else if (cmd === `user-info`) {
        client.commands.get('!user-info').execute(message, args);

    } else if (cmd === 'help') {
        client.commands.get('!help').execute(message, args);

    } else if (cmd === 'args-info') {
        client.commands.get('!args-info').execute(message, args);
        
    } else if (cmd === 'wz-stats') {
        client.commands.get('!wz-stats').execute(message, args);
    }
});

client.login(token);

