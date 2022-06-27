const appRoot = require('app-root-path');
const { MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');

function embed(interaction, user, stats, isHidden) {
    const statsEmbed = new MessageEmbed();
    statsEmbed.setTitle("**" + user.username + "#" + user.discriminator + "**");

    let crimeKeywords = Object.keys(stats.crimes);
    crimeKeywords.sort();
    if (crimeKeywords != 0) {
        let crimesString = "";
        for (let crime of crimeKeywords) {
            crimesString += "\n" + crime + ": " + stats.crimes[crime];
        }
        statsEmbed.addFields(
            {
                name: 'Crimes:',
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
            votesString += (word == keywordSplit[0] ? "" : " ") + utils.upper(word);
        }
        votesString += ": " + stats.votes[vote];
    }
    if (votesString.length != 0) {
        statsEmbed.addFields(
            {
                name: 'Votes:',
                value: votesString,
                inline: false
            }
        );
    }

    if (!crimeKeywords.length && !votesString.length) {
        statsEmbed.setDescription('No stats for this user.')
        interaction.reply({
            embeds: [statsEmbed],
            ephemeral: isHidden == null ? false : isHidden
        });
        return;
    }

    interaction.reply({
        embeds: [statsEmbed],
        ephemeral: isHidden == null ? false : isHidden
    });
    return;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Get the stats of a user.')
        .addUserOption((option) => slashOptions.user(option, false))
        .addBooleanOption((option) => slashOptions.hidden(option, false)),
    execute(client, interaction) {
        const { options } = interaction;
        let user = options.getUser('user');
        if (user == null) { user = interaction.user; }

        const courtcasesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/courtroom.json';
        const courtcases = utils.getJSON(courtcasesPath);
        const votesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/votes.json';
        const votes = utils.getJSON(votesPath);
        console.log(courtcasesPath);

        const stats = {
            crimes: {},
            votes: {
                courtcases: 0,
                convictions: 0,
                crimes_added: 0
            }
        }
        for (let courtcaseId in courtcases.closed) {
            let courtcase = courtcases.closed[courtcaseId];

            if (courtcase.userId == user.id) {
                stats.votes.courtcases += 1;
                if (courtcase.details.verdict == 'Guilty') {
                    stats.votes.convictions += 1;
                }
            }
            if (user.id == courtcase.details.defendantId && courtcase.details.verdict == 'Guilty') {
                let crime = courtcase.details.charge;
                if (typeof stats.crimes[crime] == 'undefined') { stats.crimes[crime] = 1; }
                else { stats.crimes[crime] += 1; }
            }
        }
        for (let voteId in votes.closed) {
            let vote = votes.closed[voteId];
            if (vote.userId != user.id) { continue; }
            if (!vote.passed) { continue; }
            else if (vote.voteType == 'addcrime') {
                stats.votes.crimes_added += 1;
            }
        }
        embed(interaction, user, stats, options.getBoolean('hidden'));
    }
}
