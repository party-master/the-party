const appRoot = require('app-root-path');
const { EmbedBuilder } = require(appRoot.path + '/node_modules/discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require(appRoot.path + '/global/objects/vote.js');

let bulletPt = "› ";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('variables')
        .setDescription('Get the server\'s variables or set a value.')
        .addStringOption((option) =>
            option
                .setName('variable')
                .setDescription('Variable to get or set')
                .setRequired(false)
                .setAutocomplete(true))
        .addNumberOption((option) =>
            option
                .setName('value')
                .setDescription('A new integer value')
                .setRequired(false))
        .addNumberOption((option) => slashOptions.duration(option, false))
        .addChannelOption((option) => slashOptions.channel(option, false)),
    autocomplete(interaction) {
        const { options } = interaction;
        const focusedOption = options.getFocused(true);
        if (focusedOption.name == 'variable') {
            const choices = slashOptions.getVarChoices(interaction.guildId, options.getFocused());
            interaction.respond(choices);
            return;
        }
    },
    execute(client, interaction) {
        if (interaction.channel.type == 'dm') { return; }
        const { options } = interaction;
        const variablesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/variables.json';
        const amounts = utils.getJSON(variablesPath)['amounts'];
        let varName = options.getString('variable');
        let newAmount = options.getNumber('value');
        let newChannel = options.getChannel('channel');
        if (varName != null) {
            let isReeducation = varName == 'REEDUCATION_CHANNEL';
            let varExists = false;
            for (let variable in amounts) {
                if (varName.toUpperCase() == variable) {
                    varName = variable;
                    varExists = true;
                    break;
                }
            }
            if (!varExists) {
                interaction.reply({
                    content: `"${varName}" is not a valid variable name.`,
                    ephemeral: true
                });
                return;
            }
            else if (!isReeducation && newAmount == null || isReeducation && !newChannel) {
                let amt;
                if (isReeducation) {
                    amt = interaction.guild.channels.cache.find(channel => channel.id === amounts[varName]);
                    amt = amt ? amt : '[undefined]';
                }
                else {
                    amt = amounts[varName];
                }
                interaction.reply({
                    embeds: [
                        new EmbedBuilder().addFields({
                            name: "Variable",
                            value: `${bulletPt + varName}: ${amt}`,
                        })
                    ],
                    ephemeral: true
                });
                return;
            }
            else if (!isReeducation && newAmount != null) {
                if (varName == 'MIN_VOTES' && newAmount > 0) { newAmount = 0; }
                if (varName == 'DEFAULT_VOTE_DURATION' && newAmount < 20000) {
                    interaction.reply({
                        content: "Votes must be at least 20 seconds, 20000 milliseconds.\nDEFAULT_VOTE_DURATION is in milliseconds.",
                        ephemeral: true
                    });
                    return;
                }
                let vote = Vote.new();
                vote.open(client, 'variable', interaction);
                vote.details['variable'] = varName;
                vote.details['value'] = newAmount;
                return;
            }
            else if (isReeducation && newChannel) {
                if (newChannel.type != 0) {
                    interaction.reply({
                        content: "The re-education channel must be a text channel.",
                        ephemeral: true
                    });
                }
                else {
                    let vote = Vote.new();
                    vote.open(client, 'variable', interaction);
                    vote.details['variable'] = varName;
                    vote.details['value'] = newChannel.id;
                }
                return;
            }

        }
        else if (varName == null) {
            if (newAmount != null) {
                interaction.reply({
                    content: "Specify a variable to set.",
                    ephemeral: true
                });
                return;
            }
            varsEmbed = new EmbedBuilder();
            let varStr = [];
            for (let variable in amounts) {
                if (variable == 'REEDUCATION_CHANNEL') {
                    let channel = interaction.guild.channels.cache.find(channel => channel.id === amounts[variable]);
                    if (channel) {
                        varStr.push(bulletPt + variable + ": " + channel.toString() + "\n");
                    }
                    else {
                        varStr.push(bulletPt + variable + ": [undefined]\n");
                    }
                }
                else {
                    varStr.push(bulletPt + variable + ": " + amounts[variable] + "\n");
                }
            }
            varStr = varStr.sort().toString().replaceAll(",", "");
            varsEmbed.addFields(
                {
                    name: "Variables",
                    value: varStr,
                    inline: false
                }
            );
            interaction.reply({
                embeds: [varsEmbed],
                ephemeral: true
            });
            return;
        }
    }
}
