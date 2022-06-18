const appRoot = require('app-root-path');
const { Client, Collection } = require(appRoot.path + '/node_modules/discord.js');
const config = require('./config.json');
const fs = require('fs');

const client = new Client({ intents: [131071] });
const cmdsPath = appRoot.path + '/bot_comrade/commands/';
client.cmdsPath = cmdsPath;

// import functions
client.functions = new Collection();
const functionsPath = appRoot.path + '/bot_comrade/functions/';
const functionFiles = fs.readdirSync(functionsPath).filter(file => file.endsWith('.js'));
for (let file of functionFiles) {
  let func = require(`${functionsPath}${file}`);
  client.functions.set(func.name, func);
}

// import commands
client.commands = new Collection();
const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
  let command = require(`${cmdsPath}${file}`);
  client.commands.set(command.name, command);
}

// import sfx commands
client.sfxCommands = new Collection();
const sfxPath = appRoot.path + '/audio/sfx/';
const sfxFiles = fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
for (let file of sfxFiles) {
  let sfx = file.slice(0, -4);
  client.sfxCommands.set(sfx, require(`${cmdsPath}sfx.js`));
}

// import events
client.events = new Collection();
const eventsPath = appRoot.path + '/bot_comrade/events/';
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// handle events
for (let file of eventFiles) {
  let event = require(`${eventsPath}${file}`);
  if (event.once) { client.once(event.name, (...args) => event.exec(client, ...args)); }
  else { client.on(event.name, (...args) => event.exec(client, ...args)); }
}

client.login(config.token);
