const appRoot = require('app-root-path');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    name: 'vote',
    visible: true,
    description: 'Call a vote',
    include: [],
    optional: ["command_name(s) for specific information"],
    example: [
        "!commands",
        "!commands judge vote"
    ],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }
        Vote.open(client, 'vote', message, cmdArgs)
    }
}

