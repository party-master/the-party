const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    exec(client, message) {
        if (message.author.bot) { return; }
        
        // handle commands
        let cmdArgs = message.content.slice(globals.cmd_prefix.length).trim().split(' ');
        let cmd = utils.lower(cmdArgs.shift());
        if (message.content.startsWith(globals.cmd_prefix)) {
            if (!utils.isComrade(client, message.member)) { return; }
            try { client.commands.get(cmd).exec(client, message, cmd, cmdArgs); }
            catch (error) { }
            try { client.sfx_commands.get(cmd).exec(client, message, cmd, cmdArgs); }
            catch (error) { }
        }

        // respond
        try { client.functions.get('respond').exec(client, message); }
        catch (error) { }
    }
}