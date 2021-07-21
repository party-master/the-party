const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const fs = require('fs');

function embed(message, user, stats) {
    let embed_stats = new Discord.MessageEmbed();
    embed_stats.setTitle(user.username);

    let crime_keys = Object.keys(stats.crimes);
    crime_keys.sort();
    if (crime_keys != 0) {
        let crimes_string = "";
        for (let crime of crime_keys) {
            crimes_string += "\n" + crime + ": " + stats.crimes[crime];
        }
        embed_stats.addFields(
            {
                name: '__Crimes__',
                value: crimes_string,
                inline: false
            }
        );
    }

    let votes_string = "";
    for (let vote in stats.votes) {
        if (stats.votes[vote] == 0) { continue; }
        let key_split = vote.toString().split('_');
        votes_string += "\n";
        for (let word of key_split) {
            votes_string += " " + utils.upper(word);
        }
        votes_string += ": " + stats.votes[vote];
    }
    if (votes_string.length != 0) {
        embed_stats.addFields(
            {
                name: '__Votes__',
                value: votes_string,
                inline: false
            }
        );
    }
    
    if (crime_keys.length == 0 && votes_string.length == 0) {
        message.channel.send('No stats for ' + user.username);
        return;
    }

    message.channel.send(embed_stats);
    return;
}

module.exports = {
    name: 'stats',
    exec(client, message, cmdArgs) {
        // return; 
        // add accused
        
        let user;
        const users = message.mentions.users.array();
        if (cmdArgs[0] == 'me') { user = message.author; }
        else if (users.length == 0) { return; }
        else {user = client.users.resolve(users[0].id); }

        const path_courtcases = appRoot.path + '/guilds/' + message.guild.id + '/courtroom.json';
        const path_votes = appRoot.path + '/guilds/' + message.guild.id + '/votes.json';
        const courtcases = utils.getJSON(path_courtcases);
        const votes = utils.getJSON(path_votes);

        let stats = {
            crimes: {},
            votes: {
                courtcases: 0,
                convictions: 0,
                crimes_added: 0
            }
        }
        for (let courtcase_id in courtcases.closed) {
            let courtcase = courtcases.closed[courtcase_id];
            let defendant_ids = new Array(courtcase.details.defendant_ids);

            if (courtcase.user_id == user.id) {
                stats.votes.courtcases += 1;
                if (courtcase.details.verdict == 'Guilty') {
                    stats.votes.convictions += defendant_ids.length;
                }
            }
            if (courtcase.details.verdict == 'Guilty') {
                for (let user_id of defendant_ids) {
                    if (user_id != user.id) { continue; }
                    let crime = courtcase.details.charge;
                    if (typeof stats.crimes[crime] == 'undefined') { stats.crimes[crime] = 1; }
                    else { stats.crimes[crime] += 1; }
                }
            }
        }
        for (let vote_id in votes.closed) {
            let vote = votes.closed[vote_id];
            if (vote.user_id != user.id) { continue; }
            if (!vote.passed) { continue; }
            else if (vote.vote_type == 'addcrime') {
                stats.votes.crimes_added += 1;
            }
        }
        
        embed(message, user, stats);
    }
}
