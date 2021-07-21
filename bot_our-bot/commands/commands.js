const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const fs = require('fs');

const sfx_commands = [];
const path_sfx = appRoot.path + '/audio/sfx/';
const sfx_files = fs.readdirSync(path_sfx).filter(file => file.endsWith('.mp3'));
for (let file of sfx_files) { sfx_commands.push(globals.cmd_prefix + file.slice(0, -4)); }
sfx_commands.sort();

module.exports = {
    name: 'commands',
    visible: true,
    description: 'Get the list of commands or information about specific commands',
    include: [],
    optional: ["command_name(s) for specific information"],
    example: [
        globals.cmd_prefix + "commands",
        globals.cmd_prefix + "commands judge vote"
    ],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }

        // embed commands list
        let embed_cmds = new Discord.MessageEmbed();
        let cmds_string, command;
        if (cmdArgs.length == 0) {
            cmds_string = "";
            for (var entry of client.commands.entries()) {
                command = entry[1];
                if (command.visible) {
                    cmds_string += "\n" + globals.cmd_prefix + command.name;
                }
            }
            // embed_cmds.setTitle("The Party");
            embed_cmds.setThumbnail(globals.img_party);
            embed_cmds.addFields(
                {
                    name: '**__Commands__**',
                    value: cmds_string,
                    inline: false
                }
            ).setFooter(
                "Include command name(s) with '" + globals.cmd_prefix + "commands' for more info."
                + "\nExample: " + globals.cmd_prefix + "commands vote crimes"
            );
            message.channel.send(embed_cmds);
            return;
        }

        // embed specific commands
        else {
            cmds_str = "";
            cmds_listed = [];
            while (true) {
                for (let cmd of cmdArgs) {
                    if (cmd.startsWith(globals.cmd_prefix)) { cmd = cmd.substring(1); }

                    command = client.commands.get(cmd);
                    if (typeof (command) == 'undefined' || !command.visible) { continue; }
    
                    let next = false;
                    for (let listed of cmds_listed) if (listed == cmd) next = true;
                    if (next) { continue; }
                    cmds_listed.push(cmd);
    
                    if (cmds_str == "") { cmds_str += "\u200B"; }
                    cmds_str += "\n**" + globals.cmd_prefix + cmd + "**\n" + command.description + "\n";
                    if (command.include || command.optional || command.example ) {
                        cmds_str += "```prolog\n";
                        for (let label of ['include', 'optional', 'example', 'extra']) {
                            if (command[label].length) {
                                if (label != 'extra') {
                                    cmds_str += "\n\n" + utils.upper(label);
                                }
                                for (let arg of command[label]) {
                                    cmds_str += "\n" + arg;
                                }
                            }
                        }
                        cmds_str += "```";
                    }
                }
                break;
            }
            if (cmds_str == "") { return; }
            // embed_cmds.setTitle("The Party");
            embed_cmds.addFields(
                {
                    name: '**__Commands__**',
                    value: cmds_str,
                    inline: false
                }
            )
            embed_cmds.setFooter("Brought to you by The Party", globals.img_party);
            message.channel.send(embed_cmds);
            return;
        }
    }
}

