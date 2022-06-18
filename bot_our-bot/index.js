const appRoot = require('app-root-path');
const { Client, Collection } = require(appRoot.path + '/node_modules/discord.js');
const config = require(appRoot.path + '/bot_our-bot/config.json');
const fs = require('fs');

const client = new Client({ intents: [131071] });

// import functions
client.functions = new Collection();
const functionsPath = appRoot.path + '/bot_our-bot/functions/';
const functionFiles = fs.readdirSync(functionsPath).filter(file => file.endsWith('.js'));
for (let file of functionFiles) {
	let func = require(`${functionsPath}${file}`);
	client.functions.set(func.name, func);
}

// import commands
client.commands = new Collection();
const cmdsPath = appRoot.path + '/bot_our-bot/commands/';
client.cmdsPath = cmdsPath;
const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
	let command = require(`${cmdsPath}${file}`);
	client.commands.set(command.name, command);
}

// import events
client.events = new Collection();
const eventsPath = appRoot.path + '/bot_our-bot/events/';
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// handle events
for (let file of eventFiles) {
  let event = require(`${eventsPath}${file}`);
  if (event.once) { client.once(event.name, (...args) => event.exec(client, ...args)); }
  else { client.on(event.name, (...args) => event.exec(client, ...args)); }
}

client.login(config.token);
