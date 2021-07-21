const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');
const schedule = require('node-schedule');
const fs = require('fs');

module.exports = {
    name: 'checkOpenVotes',
    description: 'Checks for and closes open votes',
    exec(client) {
        const files_guilds = fs.readdirSync(appRoot.path + '/guilds/');
        for (guild_id of files_guilds) {
            for (path_suffix of ['/votes.json', '/courtroom.json']) {
                const path_votes = appRoot.path + '/guilds/' + guild_id + path_suffix;
                const votes = utils.getJSON(path_votes);
                let time_now = new Date().getTime();
                for (vote_id of Object.keys(votes['open'])) {
                    let vote = Vote.new();
                    vote.assign(votes['open'][vote_id]);
                    if (vote.time_close < time_now) { vote.close(client); }
                    else { schedule.scheduleJob(vote.time_close, function () { vote.close(client); }); }
                }
            }
        }
    }
}
