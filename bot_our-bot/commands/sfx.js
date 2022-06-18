const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const globals = require(appRoot.path + '/global/globals.js');
const fs = require('fs');

const sfxPath = appRoot.path + '/audio/sfx/';

function getSfxCommands() {
    let sfxCommands = [];
    let sfxFiles = fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
    for (let file of sfxFiles) { sfxCommands.push(globals.cmdPrefix + file.slice(0, -4)); }
    sfxCommands.sort();
    return sfxCommands;
}

function getSfxCommandsString(shorten) {
    let limit = 4;
    let counter = 0;
    let sfxString = ""
    for (let sfx of getSfxCommands()) {
        sfxString += "\n" + sfx;
        counter += 1;
        if (shorten && counter >= limit) {
            sfxString += "\n...";
            break;
        }
    }
    return sfxString;
}

module.exports = {
    name: 'sfx',
    visible: true,
    description: 'Get the list of sound effects:',
    include: [],
    optional: [],
    example: [],
    extra: [ getSfxCommandsString(true) ],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }        
        let sfxCommands = getSfxCommands();
        let embed = new MessageEmbed();
        if (sfxCommands.length < 12) {  // single column limit
            let sfxString = "";
            for (let sfx of sfxCommands) {
                sfxString += "\n" + sfx;
            }
            embed.addFields(
                {
                    name: '__Sound Effects__',
                    value: sfxString,
                    inline: true
                }
            );
        }
        else {
            let counter = 0;
            let sfxStringCol1 = "";
            let sfxStringCol2 = "";
            for (let sfx of sfxCommands) {
                if (counter < sfxCommands.length / 2) {
                    sfxStringCol1 += "\n" + sfx;
                }
                else {
                    sfxStringCol2 += "\n" + sfx;
                }
                counter += 1;
            }
            embed.addFields(
                {
                    name: '__Sound Effects__',
                    value: sfxStringCol1,
                    inline: true
                },
                {
                    name: '‍',
                    value: sfxStringCol2,
                    inline: true
                }
            );
        }
        message.channel.send({ embeds: [embed] });
    }
}
