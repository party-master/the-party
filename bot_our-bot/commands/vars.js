const appRoot = require('app-root-path');
const { MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');

module.exports = {
    name: 'vars',
    visible: true,
    description: 'Get the list of variables or edit a variable',
    include: [],
    optional: [
        "variable_name <number>",
        "- opens a vote on a new variable value"
    ],
    example: [
        "!vars",
        "!vars min_votes 3"
    ],
    extra: [],
    exec(client, message, cmdArgs) {
        if (message.channel.type == 'dm') { return; }
        let variablesPath = appRoot.path + '/guilds/' + message.guild.id + '/variables.json';
        let variables = utils.getJSON(variablesPath);
        let amounts = variables['amounts'];
        if (cmdArgs.length == 0) {
            varsEmbed = new MessageEmbed()
            varsEmbed.setTitle("Variables")
            varsEmbed.setDescription(
                    Object.keys(amounts).map(
                        amount => "- " + amount + ": " + amounts[amount]
                            + ((amount == 'default_vote_duration' || amount == 'min_edu_duration') ? "ms (" + utils.msToTimecode(amounts[amount]) + ")" : "") + "\n"
                    ).sort().toString().replaceAll(",", "")
                )
            message.channel.send({ embeds: [varsEmbed] })
        }
        else if (!amounts[cmdArgs[0]]) { return; }
        let amount = amounts[cmdArgs[0]];
        if (cmdArgs.length == 1) { message.channel.send(cmdArgs[0] + ": " + amount); }
        else if (cmdArgs.length >= 2) {
            if (isNaN(cmdArgs[1])) { message.channel.send("Value needs to be an integer.") }
            else {
                let vote = Vote.new();
                vote.open(client, 'variable', message, cmdArgs);
                vote.details['var'] = cmdArgs[0];
                vote.details['value'] = cmdArgs[1];
            }
        }
    }
}

