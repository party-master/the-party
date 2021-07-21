const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const globals = require(appRoot.path + '/global/globals.js');

let embed_notcomrad = new Discord.MessageEmbed();
embed_notcomrad.setThumbnail(globals.img_party);
embed_notcomrad.addFields(
    {
        name: 'You are not a Comrade',
        value: "\u200B\nTo be a Comrade\nis to love The Party",
        inline: false
    }
);

module.exports = {
    name: 'notComradeEmbed',
    embed: embed_notcomrad
}
