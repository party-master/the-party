const Discord = require('../node_modules/discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const utils = require('../utils/functions.js')

const ch_court = '711750664404861059';  // the party

var musings = utils.getLines("bot_comrade/lists/musings.txt");
var warnings = utils.getLines("bot_comrade/lists/warnings.txt");
var affirmations = utils.getLines("bot_comrade/lists/affirmations.txt");

var chance_respond = 0.35;
var chance_warn = 0.2;

client.on('ready', () => {
    console.log("Comrade Online");
});

client.on('message', (message) => {
  var ch, report, user;
  if (message.author.bot == false){
    report = utils.getReport(message);
    if (report['crime']){
      if (message.channel.type != 'dm'){
        if (Math.random() < chance_respond){
          ch = client.channels.cache.get(message.channel.id);
          setTimeout(() => { ch.send(utils.randItem(musings)); }, utils.randInteger(750, 2500));
        }
        if (Math.random() < chance_warn){
          user = client.users.cache.get(message.author.id);
          user.send(utils.randItem(warnings));
        }
      }
      else{
        ch = client.channels.cache.get(ch_court);
        ch.send(message.author.toString() + " said to me \"" + line + "\" !");
      }      
    }
    else if (report['goodthink']){
      ch = client.channels.cache.get(message.channel.id);
      setTimeout(() => { ch.send(utils.randItem(affirmations)); }, utils.randInteger(750, 2500));
    }
  }
})

client.login(config.token);
