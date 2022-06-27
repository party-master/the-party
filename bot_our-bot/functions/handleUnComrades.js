const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'handleUncomrades',
    execute(client, interaction) {
        if (utils.isTerrorist(client, interaction.member)) {
            interaction.reply({
                embeds: [client.functions.get('terroristEmbed').embed],
                ephemeral: true
            });
            return true;
        }
        else if (!utils.isComrade(client, interaction.member)) {
            interaction.reply({
                embeds: [client.functions.get('uncomradeEmbed').embed],
                ephemeral: true
            });
            return true;
        }
        return false;
    }
}