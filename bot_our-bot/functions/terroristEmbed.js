const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const globals = require(appRoot.path + '/global/globals.js');

let embed_terrorist = new MessageEmbed();
embed_terrorist.setThumbnail(globals.img_party);
embed_terrorist.addFields(
    {
        name: 'You are a Terrorist',
        value: "\u200B\nTo be a Comrade\nis to love The Party",
        inline: false
    }
)

module.exports = {
    name: 'terroristEmbed',
    embed: embed_terrorist
}
