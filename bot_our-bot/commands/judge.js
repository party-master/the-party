const appRoot = require('app-root-path');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    name: 'judge',
    visible: true,
    description: 'Bring a case against potential terrorists',
    include: [
        "@defendant(s)",
        "crime=crime_keyword"
    ],
    optional: [
        "time_units=<number>",
        "- units: [\'secs\', \'mins\', \'hours\', \'days\']"
    ],
    example: ["!judge @partymaster crime=wrongthink mins=5"],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }
        Vote.open(client, 'courtcase', message, cmdArgs)
    }
}

