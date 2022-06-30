const appRoot = require('app-root-path');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'guildCreate',
    once: false,
    execute(client, guild) {
        let alreadyExists = utils.checkCreateGuildFiles(guild.id);

        let row = new MessageActionRow();
        let button = new MessageButton();
        button.setCustomId("initializeGuild");
        button.setLabel("Initialize");
        button.setStyle('PRIMARY');
        row.addComponents([button]);

        guild.systemChannel.send({
            content: "Move the \'Our Bot\' role to the top of this server's roles list, then press \'Initialize\'",
            components: [row]
        });
    }
}