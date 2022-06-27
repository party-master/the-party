const appRoot = require('app-root-path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('judge')
        .setDescription('Bring a case against potential terrorists.')
        .addUserOption((option) => slashOptions.user(option, true))
        .addStringOption((option) =>
            option
                .setName('crime')
                .setDescription('The name of a crime')
                .setRequired(true)
                .setAutocomplete(true))
        .addNumberOption((option) => slashOptions.duration(option, false))
        .addStringOption((option) => slashOptions.reason(option, false, 'charge')),
    autocomplete(interaction) {
        const { options } = interaction;
        const focusedInput = options.getFocused();
        const focusedOption = options.getFocused(true);
        if (focusedOption.name == 'crime') {
            const choices = slashOptions.getCrimeChoices(interaction.guildId, focusedInput);
            interaction.respond(choices);
        }
    },
    execute(client, interaction) {
        Vote.open(client, 'courtcase', interaction)
    }
}
