const Discord = require('../node_modules/discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const utils = require('../utils/functions.js')
const fs = require('fs');

testing = true;
if (testing){
  // sandbox channels
  ch_court = '713990723602743357';
}
else{
  // party channels
  ch_court = '711750664404861059';
}

wrongthink = utils.getLines("global lists/wrongthink.txt");

client.on('ready', () => {
    console.log("Historian Online");
});

client.on('message', (message) => {
  if (message.author.bot == false){
    if (utils.getReport(message)['crime']){
      if (message.channel.type != 'dm'){
        message.delete();
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
  }
})

client.login(config.token);
