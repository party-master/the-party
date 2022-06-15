const appRoot = require('app-root-path');
const { Discord, Client, Collection, Intents } = require(appRoot.path + '/node_modules/discord.js');
const config = require('./config.json');
const fs = require('fs');

const client = new Client(
	{ intents: [131071] }
);
const path_cmds = appRoot.path + '/bot_comrade/commands/';
client.path_cmds = path_cmds;

// import functions
client.functions = new Collection();
const path_functions = appRoot.path + '/bot_comrade/functions/';
const functionFiles = fs.readdirSync(path_functions).filter(file => file.endsWith('.js'));
for (let file of functionFiles) {
  let func = require(`${path_functions}${file}`);
  client.functions.set(func.name, func);
}

// import commands
client.commands = new Collection();
const commandFiles = fs.readdirSync(path_cmds).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
  let command = require(`${path_cmds}${file}`);
  client.commands.set(command.name, command);
}

// import sfx commands
client.sfx_commands = new Collection();
const path_sfx = appRoot.path + '/audio/sfx/';
const sfx_files = fs.readdirSync(path_sfx).filter(file => file.endsWith('.mp3'));
for (let file of sfx_files) {
  let sfx = file.slice(0, -4);
  client.sfx_commands.set(sfx, require(`${path_cmds}sfx.js`));
}

client.once('ready', () => { console.log("Comrade Online"); });

client.on('messageCreate', (message) => {
  try { client.functions.get('handleMessage').exec(client, message); }
  catch (error) { }
  
});

client.login(config.token);
