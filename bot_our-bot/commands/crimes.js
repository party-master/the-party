const appRoot = require('app-root-path');
const { MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require(appRoot.path + '/global/objects/vote.js');

let cutoffSingleCol = 12;
let bulletPt = "› ";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crimes')
        .setDescription('Get, add to, or remove from the list of crimes.')
        .addStringOption((option) =>
            option
                .setName('add')
                .setDescription('Add a crime')
                .setRequired(false)
                .setAutocomplete(false))
        .addStringOption((option) =>
            option
                .setName('remove')
                .setDescription('Remove a crime')
                .setRequired(false)
                .setAutocomplete(true))
        .addNumberOption((option) => slashOptions.duration(option, false))
        .addBooleanOption((option) => slashOptions.hidden(option, false)),
    autocomplete(interaction) {
        const { options } = interaction;
        const focusedOption = options.getFocused(true);
        if (focusedOption.name == 'remove') {
            const choices = slashOptions.getCrimeChoices(interaction.guildId, options.getFocused());
            interaction.respond(choices);
            return;
        }
    },
    execute(client, interaction) {
        if (interaction.channel.type == 'dm') { return; }
        const { options } = interaction;
        const add = options.getString('add');
        const remove = options.getString('remove');
        const isHidden = options.getBoolean('hidden');
        const variablesPath = appRoot.path + '/guilds/' + interaction.guildId + '/variables.json';
        const crimes = utils.getJSON(variablesPath)['crimes'];

        if (add == null && remove == null) {
            let crimesEmbed = new MessageEmbed();
            if (crimes.length < cutoffSingleCol) {
                let crimeElems = crimes.map(crime => bulletPt + utils.upper(crime)).sort();
                let crimesStr = crimeElems.join("\n");
                crimesEmbed.addFields({
                    name: "**Crimes**",
                    value: crimesStr,
                    inline: true
                });
            }
            else {
                let counter = 0;
                let crimesStrCol1 = "";
                let crimesStrCol2 = "";
                for (let crime of crimes.sort()) {
                    if (counter + 1 <= crimes.length / 2) {
                        crimesStrCol1 += "\n" + bulletPt + utils.upper(crime);
                    }
                    else {
                        crimesStrCol2 += "\n" + bulletPt + utils.upper(crime);
                    }
                    counter += 1;
                }
                crimesEmbed.addFields(
                    {
                        name: "**Crimes**",
                        value: crimesStrCol1,
                        inline: true
                    },
                    {
                        name: '‍‍',
                        value: crimesStrCol2,
                        inline: true
                    }
                );
            }
            interaction.reply({
                embeds: [crimesEmbed],
                ephemeral: isHidden == null ? false : isHidden
            });
        }
        else if (add != null || remove != null) {
            if (add != null) {
                for (let crime of crimes) {
                    if (add.length > 100) {
                        interaction.reply({
                            content: "Crime names must be 1-100 characters.",
                            ephemeral: true
                        });
                        return;
                    }
                    if (add.toLowerCase() == crime.toLowerCase()) {
                        interaction.reply({
                            content: `${utils.upper(crime)} is already a crime.`,
                            ephemeral: true
                        });
                        return;
                    }
                }
            }
            let vote = Vote.new();
            if (add != null) { vote.open(client, 'addcrime', interaction); }
            else if (remove != null) { vote.open(client, 'removecrime', interaction); }
        }
    }
}

