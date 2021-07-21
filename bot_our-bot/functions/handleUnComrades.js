const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'handleUnComrades',
    exec(client, message, cmd, cmdArgs) {
        if (cmd == 'help') { return; }
        if (utils.isTerrorist(client, message.member)) {
            message.channel.send(client.functions.get('terroristEmbed').embed);
            return true;
        }
        else if (!utils.isComrade(client, message.member)) {
            message.channel.send(client.functions.get('notComradeEmbed').embed);
            return true;
        }
        return false;
    }
}