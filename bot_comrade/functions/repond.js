const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const Report = require (appRoot.path + '/global/objects/report.js');

var musings = utils.getLines("/bot_comrade/lists/musings.txt");
var warnings = utils.getLines("/bot_comrade/lists/warnings.txt");
var affirmations = utils.getLines("/bot_comrade/lists/affirmations.txt");
var reactions_affirmations = utils.getLines("/bot_comrade/lists/reactions_affirmations.txt");

var chance_respond = 0.2;
var chance_warn = 0.2;

module.exports = {
    name: 'respond',
    exec(client, message) {
        if (message.author.bot == false){
            let user, emoji;
            let report = Report.get(message);
            if (report.crime){
                if (message.channel.type != 'dm'){
                    if (Math.random() < chance_respond){
                        setTimeout(() => { message.channel.send(utils.randItem(musings)); }, utils.randInteger(750, 2500));
                    }
                    if (Math.random() < chance_warn){
                        user = client.users.cache.get(message.author.id);
                        user.send(utils.randItem(warnings));
                    }
                }
                else{ client.functions.get('snitch').exec(client, message, report); }      
            }
            else if (report.goodthink){
                if (Math.random() < chance_respond) {
                    setTimeout(() => { message.channel.send(utils.randItem(affirmations)); }, utils.randInteger(750, 2100));
                }
                else {
                    emoji = utils.randItem(reactions_affirmations);
                    setTimeout(() => { message.react(emoji); }, utils.randInteger(750, 2500));
                }
            }
        }
    }
}
