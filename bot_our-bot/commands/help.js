const appRoot = require('app-root-path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get some help.'),
    execute(client, interaction) {
        let isComrade = utils.isComrade(client, interaction.member);
        if (!isComrade && interaction.commandName != 'help') {
            client.functions.get('handleUncomrades').execute(client, interaction);
            return;
        }
        else if (isComrade && interaction.commandName == 'help') {
            interaction.reply({
                content: 'Keep it up!',
                ephemeral: true
            });
            return;
        }
        else if (!isComrade) {
            interaction.reply("Repeat after me, " + interaction.member.user.toString() + ":\nI love The Party");
            return true;
        }
    }
}
