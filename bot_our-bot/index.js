const appRoot = require('app-root-path');
const { Client, Collection, Intents } = require(appRoot.path + '/node_modules/discord.js');
const config = require('./config.json');
const fs = require('fs');

 const client = new Client({ intents: [131071, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// import functions
client.functions = new Collection();
const functionsPath = appRoot.path + '/bot_our-bot/functions/';
const functionFiles = fs.readdirSync(functionsPath).filter(file => file.endsWith('.js'));
for (let file of functionFiles) {
	let func = require(`${functionsPath}${file}`);
	client.functions.set(func.name, func);
	delete require.cache[require.resolve(`${functionsPath}${file}`)];
}

// import commands
client.commands = new Collection();
const cmdsPath = appRoot.path + '/bot_our-bot/commands/';
client.cmdsPath = cmdsPath;
const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
	let command = require(`${cmdsPath}${file}`);
	client.commands.set(command.data.name, command);
	delete require.cache[require.resolve(`${cmdsPath}${file}`)];
}

// import events
client.events = new Collection();
const eventsPath = appRoot.path + '/bot_our-bot/events/';
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (let file of eventFiles) {
	let event = require(`${eventsPath}${file}`);
	if (event.once) { client.once(event.name, (...args) => event.execute(client, ...args)); }
	else { client.on(event.name, (...args) => event.execute(client, ...args)); }
	delete require.cache[require.resolve(`${eventsPath}${file}`)];
}

client.login(config.token);
