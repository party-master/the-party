const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const fs = require('fs');

const sfxCommands = [];
const sfxPath = appRoot.path + '/audio/sfx/';
const sfxFiles = fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
for (let file of sfxFiles) { sfxCommands.push(globals.cmdPrefix + file.slice(0, -4)); }
sfxCommands.sort();

module.exports = {
    name: 'commands',
    visible: true,
    description: 'Get the list of commands or information about specific commands',
    include: [],
    optional: ["command_name(s) for specific information"],
    example: [
        globals.cmdPrefix + "commands",
        globals.cmdPrefix + "commands judge vote"
    ],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }

        // embed commands list
        let cmdsEmbed = new MessageEmbed();
        let cmdsString, command;
        if (cmdArgs.length == 0) {
            cmdsString = "";
            for (var entry of client.commands.entries()) {
                command = entry[1];
                if (command.visible) {
                    cmdsString += "\n" + globals.cmdPrefix + command.name;
                }
            }
            // cmdsEmbed.setTitle("The Party");
            cmdsEmbed.setThumbnail(globals.imgParty);
            cmdsEmbed.addFields(
                {
                    name: '**__Commands__**',
                    value: cmdsString,
                    inline: false
                }
            ).setFooter({
                text: "Include command name(s) with '" + globals.cmdPrefix + "commands' for more info."
                + "\nExample: " + globals.cmdPrefix + "commands vote crimes"
            });
            message.channel.send({ embeds: [cmdsEmbed] });
            return;
        }

        // embed specific commands
        else {
            cmdsStr = "";
            cmdsListed = [];
            while (true) {
                for (let cmd of cmdArgs) {
                    if (cmd.startsWith(globals.cmdPrefix)) { cmd = cmd.substring(1); }

                    command = client.commands.get(cmd);
                    if (typeof (command) == 'undefined' || !command.visible) { continue; }
    
                    let next = false;
                    for (let listed of cmdsListed) if (listed == cmd) next = true;
                    if (next) { continue; }
                    cmdsListed.push(cmd);
    
                    if (cmdsStr == "") { cmdsStr += "\u200B"; }
                    cmdsStr += "\n**" + globals.cmdPrefix + cmd + "**\n" + command.description + "\n";
                    if (command.include || command.optional || command.example ) {
                        cmdsStr += "```prolog\n";
                        for (let label of ['include', 'optional', 'example', 'extra']) {
                            if (command[label].length) {
                                if (label != 'extra') {
                                    cmdsStr += "\n\n" + utils.upper(label);
                                }
                                for (let arg of command[label]) {
                                    cmdsStr += "\n" + arg;
                                }
                            }
                        }
                        cmdsStr += "```";
                    }
                }
                break;
            }
            if (cmdsStr == "") { return; }
            // cmdsEmbed.setTitle("The Party");
            cmdsEmbed.addFields(
                {
                    name: '**__Commands__**',
                    value: cmdsStr,
                    inline: false
                }
            )
            cmdsEmbed.setFooter({ text: "Brought to you by The Party", iconURL: globals.imgParty });
            message.channel.send({ embeds: [cmdsEmbed] });
            return;
        }
    }
}

