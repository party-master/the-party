const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute(client, interaction) {
        const { commandName } = interaction;
        utils.checkCreateGuildFiles(client, interaction.guild.id);
        utils.checkAppendMember(interaction.guild.id, interaction.member);
        
        // handle autocomplete commands
        if (interaction.isAutocomplete()) {
            client.commands.get(commandName).autocomplete(interaction);
        }

        // handle slash commands
        else if (interaction.isCommand()) {
            if (commandName == 'help' || !client.functions.get('handleUncomrades').execute(client, interaction))  {
                client.commands.get(commandName).execute(client, interaction);
            }
        }

        // handle buttons
        else if (interaction.isButton()) {
            try { client.functions.get(interaction.customId).execute(client, interaction); }
            catch (error) { }
        }
    }
}