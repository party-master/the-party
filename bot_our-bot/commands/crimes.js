const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
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
        const variablesPath = appRoot.path + '/guilds/' + message.guild.id + '/variables.json';
        const variables = utils.getJSON(variablesPath);
        const crimes = variables['crimes'];

        if (cmdArgs.length == 0) {
            let crimesEmbed = new MessageEmbed();
            if (crimes.length < 12) {
                let crimeElems = crimes.map(crime => "- " + utils.upper(crime)).sort();
                let crimesStr = crimeElems.join("\n");
                crimesEmbed.addFields(
                    {
                        name: '‍__Crimes__',
                        value: crimesStr,
                        inline: true
                    }
                )
            }
            else {
                let counter = 0;
                let crimesStrCol1 = "";
                let crimesStrCol2 = "";
                for (let crime of crimes.sort()) {
                    if (counter < crimes.length / 2) {
                        crimesStrCol1 += "\n- " + utils.upper(crime);
                    }
                    else {
                        crimesStrCol2 += "\n- " + utils.upper(crime);
                    }
                    counter += 1;
                }
                crimesEmbed.addFields(
                    {
                        name: '‍__Crimes__',
                        value: crimesStrCol1,
                        inline: true
                    },
                    {
                        name: '‍',
                        value: crimesStrCol2,
                        inline: true
                    }
                );
            }
            message.channel.send({ embeds: [crimesEmbed] });
        }
        else if (cmdArgs.length > 1 && (cmdArgs[0] == "add" || cmdArgs[0] == "remove")) {
            let vote = Vote.new();
            if (cmdArgs[0] == "add") { vote.open(client, 'addcrime', message, cmdArgs); }
            else if (cmdArgs[0] == "remove") { vote.open(client, 'removecrime', message, cmdArgs); }
        }
    }
}

