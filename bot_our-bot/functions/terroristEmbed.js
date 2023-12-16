const appRoot = require('app-root-path');
const { EmbedBuilder  } = require(appRoot.path + '/node_modules/discord.js');

const terroristEmbed = new EmbedBuilder();
// terroristEmbed.setThumbnail(globals.imgParty);
terroristEmbed.addFields(
    {
        name: 'You are a Terrorist',
        value: "\u200B\nTo be a Comrade\nis to love The Party",
        inline: false
    }
);

module.exports = {
    name: 'terroristEmbed',
    embed: terroristEmbed
}
