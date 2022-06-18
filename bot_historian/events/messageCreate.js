const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    exec(client, message) {
        if (message.author.bot) { return; }
        
        // handle commands
        let cmdArgs = message.content.slice(globals.cmdPrefix.length).trim().split(' ');
        let cmd = utils.lower(cmdArgs.shift());
        try { client.commands.get(cmd).exec(client, message, cmdArgs); }
        catch (error) { }
    }
}