const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    exec(client, message) {

        // commands
        if (message.content.startsWith(globals.cmdPrefix)) {
            let cmdArgs = message.content.slice(globals.cmdPrefix.length).trim().split(' ');
            let cmd = cmdArgs.shift();
            if (message.channel.type != 'dm') {
                utils.checkCreateGuildFiles(message.guild.id);
                if (client.functions.get('handleUnComrades').exec(client, message, cmd, cmdArgs)) {
                    return;
                }
            }
            try { client.commands.get(cmd).exec(client, message, cmdArgs); }
            catch (error) {console.log(error); }
        }
        
        // self embeds
        else if (message.embeds.length && message.author.id == client.user.id) {
            Vote.handleSelfEmbed(client, message);
        }

        // make comrade
        else {
            if (!message.author.bot && utils.searchForLine(message, utils.getLines("/global/lists/++goodthink.txt"))) {
                utils.makeComrade(client, message.guild.id, message.author.id);
            }
        }
    }
}
