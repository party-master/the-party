const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const Report = require (appRoot.path + '/global/objects/report.js');

const repliesAffirmations = utils.getLines("/bot_comrade/lists/replies_affirmations.txt");
const repliesSadism = utils.getLines("/bot_comrade/lists/replies_sadism.txt");
const msgsWarnings = utils.getLines("/bot_comrade/lists/msgs_warnings.txt");

const chanceRespond = 0.2;
const chanceWarn = 0.2;

module.exports = {
    name: 'respond',
    execute(message) {
        if (message.author.bot == false){
            let report = Report.get(message);
            if (report.crime && utils.isComrade(client, message.member)){
                if (Math.random() < chanceWarn){
                    const user = client.users.cache.get(message.author.id);
                    user.send(utils.randItem(msgsWarnings));
                }
            }
            else if (report.goodthink && Math.random() < chanceRespond){
                setTimeout(() => { message.reply(utils.randItem(repliesAffirmations)); }, utils.randInteger(750, 2100));
            }
        }
        else if (message.author.id == '990401342776426497' && message.content.endsWith('has been sent to re-education.')) {
            if (Math.random() < chanceRespond){
                setTimeout(() => { message.channel.send(utils.randItem(repliesSadism)); }, utils.randInteger(750, 2100));
            }
        }
    }
}
