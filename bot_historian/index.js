const appRoot = require('app-root-path');
const { Discord, Client, Collection, Intents } = require(appRoot.path + '/node_modules/discord.js');
const config = require(appRoot.path + '/bot_historian/config.json');
const fs = require('fs');

const client = new Client({ intents: [131071] });

// import commands
client.commands = new Collection();
const cmdsPath = appRoot.path + '/bot_historian/commands/';
client.cmdsPath = cmdsPath;
const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
	let command = require(`${cmdsPath}${file}`);
	client.commands.set(command.name, command);
}

// import events
client.events = new Collection();
const eventsPath = appRoot.path + '/bot_historian/events/';
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// handle events
for (let file of eventFiles) {
  let event = require(`${eventsPath}${file}`);
  if (event.once) { client.once(event.name, (...args) => event.exec(client, ...args)); }
  else { client.on(event.name, (...args) => event.exec(client, ...args)); }
}

client.login(config.token);
