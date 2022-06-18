const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const fs = require('fs');

function embed(message, user, stats) {
    let statsEmbed = new MessageEmbed();
    statsEmbed.setTitle(user.username + "#" + user.discriminator);

    let crimeKeywords = Object.keys(stats.crimes);
    crimeKeywords.sort();
    if (crimeKeywords != 0) {
        let crimesString = "";
        for (let crime of crimeKeywords) {
            crimesString += "\n" + crime + ": " + stats.crimes[crime];
        }
        statsEmbed.addFields(
            {
                name: '__Crimes__',
                value: crimesString,
                inline: false
            }
        );
    }

    let votesString = "";
    for (let vote in stats.votes) {
        if (stats.votes[vote] == 0) { continue; }
        let keywordSplit = vote.toString().split('_');
        votesString += "\n";
        for (let word of keywordSplit) {
            votesString += " " + utils.upper(word);
        }
        votesString += ": " + stats.votes[vote];
    }
    if (votesString.length != 0) {
        statsEmbed.addFields(
            {
                name: '__Votes__',
                value: votesString,
                inline: false
            }
        );
    }
    
    if (crimeKeywords.length == 0 && votesString.length == 0) {
        message.channel.send('No stats for ' + user.username);
        return;
    }

    message.channel.send({ embeds: [statsEmbed] });
    return;
}

module.exports = {
    name: 'stats',
    exec(client, message, cmdArgs) {
        // return; 
        // add accused
        
        let user;
        const users = Array();
        message.mentions.users.map(user => users.push(user));
        if (cmdArgs[0] == 'me' || cmdArgs.length == 0) { user = message.author; }
        else if (users.length == 0) { return; }
        else {user = client.users.resolve(users[0].id); }

        const courtcasesPath = appRoot.path + '/guilds/' + message.guild.id + '/courtroom.json';
        const courtcases = utils.getJSON(courtcasesPath);
        const votesPath = appRoot.path + '/guilds/' + message.guild.id + '/votes.json';
        const votes = utils.getJSON(votesPath);

        let stats = {
            crimes: {},
            votes: {
                courtcases: 0,
                convictions: 0,
                crimesAdded: 0
            }
        }
        for (let courtcaseId in courtcases.closed) {
            let courtcase = courtcases.closed[courtcaseId];
            let defendantIds = new Array(courtcase.details.defendantIds);

            if (courtcase.userId == user.id) {
                stats.votes.courtcases += 1;
                if (courtcase.details.verdict == 'Guilty') {
                    stats.votes.convictions += defendantIds.length;
                }
            }
            if (courtcase.details.verdict == 'Guilty') {
                for (let userId of defendantIds) {
                    if (userId != user.id) { continue; }
                    let crime = courtcase.details.charge;
                    if (typeof stats.crimes[crime] == 'undefined') { stats.crimes[crime] = 1; }
                    else { stats.crimes[crime] += 1; }
                }
            }
        }
        for (let voteId in votes.closed) {
            let vote = votes.closed[voteId];
            if (vote.userId != user.id) { continue; }
            if (!vote.passed) { continue; }
            else if (vote.voteType == 'addcrime') {
                stats.votes.crimesAdded += 1;
            }
        }
        
        embed(message, user, stats);
    }
}
