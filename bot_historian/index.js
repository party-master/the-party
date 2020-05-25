const Discord = require('../node_modules/discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const utils = require('../utils/functions.js')
const fs = require('fs');

ch_court = '713990723602743357';  // sandbox
// ch_court = '711750664404861059'  // the party

wrongthink = fs.readFileSync('../global lists/wrongthink.txt', 'utf8').split(/\r?\n/);

client.on('ready', () => {
    console.log("Historian Online");
});

client.on('message', (message) => {
  if (message.author.bot == false){
    if (utils.catchWrongthink(message)['crime']){
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
