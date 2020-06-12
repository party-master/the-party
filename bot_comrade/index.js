const Discord = require('../node_modules/discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const utils = require('../utils/functions.js')
const fs = require('fs');

ch_court = '713990723602743357';  // sandbox
// ch_court = '711750664404861059'  // the party

wrongthink = utils.getLines("global lists/wrongthink.txt");
musings = utils.getLines("bot_comrade/lists/musings.txt");
warnings = utils.getLines("bot_comrade/lists/warnings.txt");
affirmations = utils.shuffle(utils.getLines("bot_comrade/lists/affirmations.txt"));

chance_respond = 0.35;
chance_warn = 0.2;

client.on('ready', () => {
    console.log("Comrade Online");
});

client.on('message', (message) => {
  msg = message.content.toLowerCase();
  if (message.author.bot == false){
    report = utils.getReport(message);
    if (report['crime']){
      if (message.channel.type != 'dm'){
        if (Math.random() < chance_respond){
          ch = client.channels.cache.get(message.channel.id);
          setTimeout(() => { ch.send(utils.randItem(musings)); }, utils.randInteger(250, 2500));
        }
        if (Math.random() < chance_warn){
          user = client.users.cache.get(message.author.id);
          user.send(utils.randItem(warnings));
        }
      }
      else{
        ch = client.channels.cache.get(ch_court);
        if (message.content.toString().length < 50){
          ch.send(message.author.toString() + " said to me \"" + message.content + "\" !");
        }
        else{
          ch.send(message.author.toString() + " said to me \"" + line + "\" !");
        }
      }      
    }
    else if (report['goodthink'] || report['goodthink_dp']){
      ch = client.channels.cache.get(message.channel.id);
      setTimeout(() => { ch.send(utils.randItem(affirmations)); }, utils.randInteger(250, 2500));
    }
  }
})

client.login(config.token);
