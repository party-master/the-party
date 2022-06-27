const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute(interaction) {
        utils.checkCreateGuildFiles(interaction.guild.id);
        const { commandName } = interaction;
        
        // handle autocomplete commands
        if (interaction.isAutocomplete()) {
            client.commands.get(commandName).autocomplete(interaction);
        }

        // handle slash commands
        else if (interaction.isCommand()) {
            client.commands.get(commandName).execute(interaction);
        }

        // handle buttons
        else if (interaction.isButton()) {
            try { client.commands.get(commandName).execute(interaction); }
            catch (error) { client.commands.get(interaction.customId.split('_')[0]).execute(interaction); }
        }
    }
}