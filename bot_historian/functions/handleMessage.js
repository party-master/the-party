const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const Report = require (appRoot.path + '/global/objects/report.js');

module.exports = {
    name: 'handleMessage',
    exec(client, message) {
        if (message.author.bot) { return; }
        
        // handle acts of crime
        let report = Report.get(message);
        if (report.crime){
            if (message.channel.type != 'dm'){ message.delete(); }
            else{ client.functions.get('snitch').exec(client, message, report); }
            return;
        }
        
        // handle commands
        let cmdArgs = message.content.slice(globals.cmd_prefix.length).trim().split(' ');
        let cmd = utils.lower(cmdArgs.shift());
        try { client.commands.get(cmd).exec(client, message, cmdArgs); }
        catch (error) { }
    }
}
