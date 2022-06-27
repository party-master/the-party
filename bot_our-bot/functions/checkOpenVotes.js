const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');
const schedule = require('node-schedule');
const fs = require('fs');

module.exports = {
    name: 'checkOpenVotes',
    description: 'Checks for and closes open votes',
    execute(client) {
        const files_guilds = fs.readdirSync(appRoot.path + '/guilds/');
        for (guildId of files_guilds) {
            for (pathSuffix of ['/votes.json', '/courtroom.json']) {
                const votesPath = appRoot.path + '/guilds/' + guildId + pathSuffix;
                const votes = utils.getJSON(votesPath);
                let timeNow = new Date().getTime();
                for (let voteId of Object.keys(votes['open'])) {
                    let vote = Vote.new();
                    vote.assign(votes['open'][voteId]);
                    if (vote.timeClose < timeNow) { vote.close(client); }
                    else { schedule.scheduleJob(vote.timeClose, function () { vote.close(client); }); }
                }
            }
        }
    }
}
