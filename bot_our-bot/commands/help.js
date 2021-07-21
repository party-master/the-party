const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'help',
    description: "Get some help!",
    visible: false,
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }
        if (cmdArgs.length != 0) { return; }
        if (!utils.isComrade(client, message.member)) {
            client.functions.get('guide').exec(client, message.member, false);
        }
        else {
            cmd = 'commands';
            cmdArgs = [];
            client.commands.get('commands').exec(client, message, cmdArgs);
        }
    }
}
