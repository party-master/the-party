const fs = require('fs');
const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {

    duration(option, isRequired) {
        return option
            .setName('duration')
            .setDescription('Vote duration in minutes')
            .setRequired(isRequired)
            .setAutocomplete(false)
    },

    hidden(option, isRequired) {
        return option
            .setName('hidden')
            .setDescription('Reply will only be visible to you')
            .setRequired(isRequired);
    },

    reason(option, isRequired, subject) {
        return option
            .setName('reason')
            .setDescription(`Reason for ${subject}`)
            .setRequired(isRequired)
    },

    user(option, isRequired) {
        return option
            .setName('user')
            .setDescription('Mention a user')
            .setRequired(isRequired);
    },

    channel(option, isRequired) {
        return option
            .setName('channel')
            .setDescription('Get a channel')
            .setRequired(isRequired);
    },

    getCommandChoices(client, input) {
        let commandFiles = fs.readdirSync(client.cmdsPath).filter(file => file.endsWith('.js'));
        let choices = Array();
        for (let file of commandFiles) {
            let cmdName = `${file}`.replace('.js', '');
            if (cmdName.toLowerCase().startsWith(input.toLowerCase())) {
                choices.push({ name: cmdName, value: cmdName });
                if (choices.length >= 25) { break; }
            }
        }
        return choices;
    },

    getCrimeChoices(guildId, input) {
        let variablesPath = appRoot.path + '/guilds/' + guildId + '/variables.json';
        let variables = utils.getJSON(variablesPath);
        let choices = Array();
        for (let crime of variables['crimes'].sort()) {
            if (crime.toLowerCase().startsWith(input.toLowerCase())) {
                crime = utils.upper(crime);
                choices.push({ name: crime, value: crime });
                if (choices.length >= 25) { break; }
            }
        }
        return choices;
    },

    getVarChoices(guildId, input) {
        let variablesPath = appRoot.path + '/guilds/' + guildId + '/variables.json';
        let variables = utils.getJSON(variablesPath)['amounts']
        let choices = Array();
        for (let key in variables) {
            if (key.toLowerCase().startsWith(input.toLowerCase())) {
                choices.push({ name: key, value: key});
                if (choices.length >= 25) { break; }
            }
        }
        return choices;
    },

    getSfxChoices(guildId, input) {
        let sfxPath = appRoot.path + '/audio/sfx/';
        let sfxFiles = fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
        let choices = Array();
        for (let key of sfxFiles) {
            key = key.replace('.mp3', '');
            if (key.toLowerCase().startsWith(input.toLowerCase())) {
                choices.push({ name: key, value: key});
                if (choices.length >= 25) { break; }
            }
        }
        return choices;
    },

}
