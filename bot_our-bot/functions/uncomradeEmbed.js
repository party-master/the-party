const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const globals = require(appRoot.path + '/global/globals.js');

let uncomradeEmbed = new MessageEmbed();
uncomradeEmbed.setThumbnail(globals.imgParty);
uncomradeEmbed.addFields(
    {
        name: 'You are not a Comrade',
        value: "\u200B\nTo be a Comrade\nis to love The Party",
        inline: false
    }
);

module.exports = {
    name: 'notComradeEmbed',
    embed: uncomradeEmbed
}
