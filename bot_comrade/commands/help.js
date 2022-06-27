const appRoot = require('app-root-path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get some help.'),
    execute(interaction) {
        let isComrade = utils.isComrade(client, interaction.member);
        if (isComrade && interaction.commandName == 'help') {
            interaction.reply({
                content: 'Keep it up!',
                ephemeral: true
            });
            return;
        }
        if (utils.isTerrorist(client, interaction.member)) {
            interaction.reply({
                content: "Kick rocks!",
                ephemeral: true
            });
            return;
        }
        else if (!isComrade) {
            interaction.reply({
                content: "Say \"I love The Party\" for access to the main channels.",
                ephemeral: true
            });
            return;
        }
    }
}
