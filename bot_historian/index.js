const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const config = require(appRoot.path + '/bot_historian/config.json');
const fs = require('fs');

const client = new Discord.Client();

// import functions
client.functions = new Discord.Collection();
const path_functions = appRoot.path + '/bot_historian/functions/';
const functionFiles = fs.readdirSync(path_functions).filter(file => file.endsWith('.js'));
for (let file of functionFiles) {
  let func = require(`${path_functions}${file}`);
  client.functions.set(func.name, func);
}

// import commands
client.commands = new Discord.Collection();
const path_cmds = appRoot.path + '/bot_historian/commands/';
client.path_cmds = path_cmds;
const commandFiles = fs.readdirSync(path_cmds).filter(file => file.endsWith('.js'));
for (let file of commandFiles) {
	let command = require(`${path_cmds}${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => { console.log("Historian Online"); });

client.on('message', (message) => {
  try { client.functions.get('handleMessage').exec(client, message); }
  catch (error) { }  
});

client.login(config.token);
