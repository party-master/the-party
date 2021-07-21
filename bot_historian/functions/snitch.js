const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'snitch',
    description: 'Expose potential terrorists to the courtroom channel',
    execute(client, message, report) {
        for (let guild of client.guilds.cache.array()) {
            let ch_court = guild.channels.cache.find(channel => channel.name == "courtroom");
            if (typeof ch_court == 'undefined') { continue; }
            if (utils.isComrade(client, guild.members.resolve(message.author))) {
                let member_ids = guild.members.cache.array().map(member => { return member.id });
                for (let member_id of member_ids){
                    if (member_id == message.author.id) {
                        ch_court.send(message.author.toString() + " said to me \"" + report.line + "\" !");
                        break;
                    }
                }
            }
        }
    }
}
