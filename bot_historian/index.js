const appRoot = require('app-root-path');
const path_root = appRoot.path;

const Discord = require(path_root + '/node_modules/discord.js');
const client = new Discord.Client();
const config = require(path_root + '/bot_historian/config.json');
const utils = require(path_root + '/utils/functions.js');

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

client.on('ready', () => {
    console.log("Historian Online");
});

client.on('message', (message) => {

  if (message.author.bot == false){
    var report = utils.getReport(message);

    if (report['crime']){
      if (message.channel.type != 'dm'){
        message.delete();
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
  }
})

client.login(config.token);
