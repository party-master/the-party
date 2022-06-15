const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const globals = require(appRoot.path + '/global/globals.js');
const fs = require('fs');

const path_sfx = appRoot.path + '/audio/sfx/';

function getSfxCommands() {
    let sfx_commands = [];
    let sfx_files = fs.readdirSync(path_sfx).filter(file => file.endsWith('.mp3'));
    for (let file of sfx_files) { sfx_commands.push(globals.cmd_prefix + file.slice(0, -4)); }
    sfx_commands.sort();
    return sfx_commands;
}

function getSfxCommandsString(shorten) {
    let limit = 4;
    let counter = 0;
    let sfx_string = ""
    for (let sfx of getSfxCommands()) {
        sfx_string += "\n" + sfx;
        counter += 1;
        if (shorten && counter >= limit) {
            sfx_string += "\n...";
            break;
        }
    }
    return sfx_string;
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
        let sfx_commands = getSfxCommands();
        let embed = new MessageEmbed();
        if (sfx_commands.length < 12) {  // single column limit
            let sfx_string = "";
            for (let sfx of sfx_commands) {
                sfx_string += "\n" + sfx;
            }
            embed.addFields(
                {
                    name: '__Sound Effects__',
                    value: sfx_string,
                    inline: true
                }
            );
        }
        else {
            let counter = 0;
            let sfx_string_col1 = "";
            let sfx_string_col2 = "";
            for (let sfx of sfx_commands) {
                if (counter < sfx_commands.length / 2) {
                    sfx_string_col1 += "\n" + sfx;
                }
                else {
                    sfx_string_col2 += "\n" + sfx;
                }
                counter += 1;
            }
            embed.addFields(
                {
                    name: '__Sound Effects__',
                    value: sfx_string_col1,
                    inline: true
                },
                {
                    name: '‍',
                    value: sfx_string_col2,
                    inline: true
                }
            );
        }
        message.channel.send({ embeds: [embed] });
    }
}
