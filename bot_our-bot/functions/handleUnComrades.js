const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
    name: 'handleUnComrades',
    exec(client, message, cmd, cmdArgs) {
        if (utils.isTerrorist(client, message.member)) {
            message.channel.send({ embeds: [client.functions.get('terroristEmbed').embed] });
            return true;
        }
        else if (!utils.isComrade(client, message.member)) {
            if (cmd == 'help') {
                message.channel.send("Repeat after me, " + message.member.user.toString() + ":\nI love The Party");
                return true;
            }
            message.channel.send({ embeds: [client.functions.get('notComradeEmbed').embed] });
            return true;
        }
        return false;
    }
}