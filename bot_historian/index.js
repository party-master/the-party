const appRoot = require('app-root-path');
const { Discord, Client, Collection, Intents } = require(appRoot.path + '/node_modules/discord.js');
const config = require(appRoot.path + '/bot_historian/config.json');
const fs = require('fs');

const client = new Client({ intents: [131071] });

// import commands
client.commands = new Collection();
const path_cmds = appRoot.path + '/bot_historian/commands/';
client.path_cmds = path_cmds;
const commandFiles = fs.readdirSync(path_cmds).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
	let command = require(`${path_cmds}${file}`);
	client.commands.set(command.name, command);
}

// import events
client.events = new Collection();
const path_events = appRoot.path + '/bot_historian/events/';
const eventFiles = fs.readdirSync(path_events).filter(file => file.endsWith('.js'));

// handle events
for (let file of eventFiles) {
  let event = require(`${path_events}${file}`);
  if (event.once) { client.once(event.name, (...args) => event.exec(client, ...args)); }
  else { client.on(event.name, (...args) => event.exec(client, ...args)); }
}

client.login(config.token);
