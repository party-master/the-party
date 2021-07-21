const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    name: 'crimes',
    visible: true,
    description: 'Get, add to, or remove from the list of crimes',
    include: [],
    optional: [
        "add new_crime_name",
        "remove existing_crime_name"
    ],
    example: [
        "!crimes",
        "!crimes add treason",
        "!crimes remove treason"
    ],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }
        const path_variables = appRoot.path + '/guilds/' + message.guild.id + '/variables.json';
        const variables = utils.getJSON(path_variables);
        const crimes = variables['crimes'];

        if (cmdArgs.length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                    .setTitle("Crimes")
                    .setDescription(crimes.map(crime => "- " + utils.upper(crime)).sort()));
            return;
        }
        else if (cmdArgs.length > 1 && (cmdArgs[0] == "add" || cmdArgs[0] == "remove")) {
            let vote = Vote.new();
            if (cmdArgs[0] == "add") { vote.open(client, 'addcrime', message, cmdArgs); }
            else if (cmdArgs[0] == "remove") { vote.open(client, 'removecrime', message, cmdArgs); }
        }
    }
}

