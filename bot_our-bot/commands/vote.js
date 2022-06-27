const appRoot = require('app-root-path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Call a vote.')
        .addStringOption((option) =>
            option
                .setName('subject')
                .setDescription('The subject of the vote')
                .setRequired(false))
        .addStringOption((option) => slashOptions.reason(option, false, 'vote'))
        .addNumberOption((option) => slashOptions.duration(option, false)),
    execute(client, interaction) {
        if (interaction.channel.type == 'dm') { return; }
        Vote.open(client, 'vote', interaction)
    }
}
