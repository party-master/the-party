const Discord = require('../node_modules/discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const utils = require('../utils/functions.js')

ch_court = '711750664404861059';

wrongthink = utils.getLines("global lists/+wrongthink.txt");

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
        ch.send(message.author.toString() + " said to me \"" + line + "\" !");
      }
    }
  }
})

client.login(config.token);
