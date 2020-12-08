const appRoot = require('app-root-path');
const path_root = appRoot.path;

const Discord = require(path_root + '/node_modules/discord.js');
const client = new Discord.Client();
const config = require(path_root + '/bot_comrade/config.json');
const utils = require(path_root + '/utils/functions.js');

var musings = utils.getLines("/bot_comrade/lists/musings.txt");
var warnings = utils.getLines("/bot_comrade/lists/warnings.txt");
var affirmations = utils.getLines("/bot_comrade/lists/affirmations.txt");
var reactions_affirmations = utils.getLines("/bot_comrade/lists/reactions_affirmations.txt");

var chance_respond = 0.4;
var chance_warn = 0.2;

const CMD_PREFIX = "!"

function isComrade(guild_id, member) {
  const guild = client.guilds.resolve(guild_id);
  const role_comrade = guild.roles.cache.find(role => role.name === 'Comrades').id;
  const is_comrade = member.roles.cache.has(role_comrade);
  if (is_comrade) { return true; }
  else { return false; }
}

function isTerrorist(guild_id, member) {
  const guild = client.guilds.resolve(guild_id);
  const role_terrorist = guild.roles.cache.find(role => role.name === 'Terrorists').id;
  const is_terrorist = member.roles.cache.has(role_terrorist);
  if (is_terrorist) { return true; }
  else { return false; }
}

function help(message) {
  if (message.mentions.users.has(client.user.id)) {
    message.channel.send("I am with you!");
  }
}

function reportRespond(message, report) {
  let ch, user, emoji;
  if (report['crime']){
    if (message.channel.type != 'dm'){
      if (Math.random() < chance_respond){
        ch = message.channel;
        setTimeout(() => { ch.send(utils.randItem(musings)); }, utils.randInteger(750, 2500));
      }
      if (Math.random() < chance_warn){
        user = client.users.cache.get(message.author.id);
        user.send(utils.randItem(warnings));
      }
    }
    else{
      var line = report['line'];
      for (let guild of client.guilds.cache.array()) {
        let ch_court = guild.channels.cache.find(channel => channel.name === "courtroom")
        if (typeof ch_court === 'undefined') { continue; }
        if (isComrade(guild.id, guild.members.resolve(message.author.id))) {
          let member_ids = guild.members.cache.array().map(member => { return member.id })
          for (let member_id of member_ids){
            if (member_id == message.author.id) {
              ch_court.send(message.author.toString() + " said to me \"" + line + "\" !");
              break;
            }
          }
        }
      }
    }      
  }
  else if (report['goodthink']){
    ch = message.channel;
    if (Math.random() < chance_respond) {
      setTimeout(() => { ch.send(utils.randItem(affirmations)); }, utils.randInteger(750, 2500));
    }
    else {
      emoji = utils.randItem(reactions_affirmations);
      setTimeout(() => { message.react(emoji); }, utils.randInteger(750, 2500));
    }
  }
}

client.once('ready', () => {
    console.log("Comrade Online");
});

client.on('message', (message) => {
  if (message.author.bot == false){
    let report = utils.getReport(message);
    reportRespond(message, report);
    if (message.content.startsWith(CMD_PREFIX)) {
      const cmdArgs = message.content.slice(CMD_PREFIX.length).trim().split(' ');
      const cmd = cmdArgs.shift();
      if (cmd === 'help') { help(message); }
    }
  }
})

client.login(config.token);
