const appRoot = require('app-root-path');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');
const fs = require('fs');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

const editEmbed = true;
const voiceTimeout = 15000;
const sfxPath = appRoot.path + '/audio/sfx/';
let sfxFiles = getSfxFiles();

function getSfxFiles() {
    return fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sfx')
        .setDescription('Call a soundboard or play a sound effect.')
        .addStringOption((option) =>
            option
                .setName('play')
                .setDescription('Choose a specific sound effect')
                .setRequired(false)
                .setAutocomplete(true)),
    autocomplete(interaction) {
        const { options } = interaction;
        const focusedOption = options.getFocused(true);
        if (focusedOption.name == 'play') {
            const choices = slashOptions.getSfxChoices(interaction.guildId, options.getFocused());
            interaction.respond(choices);
            return;
        }
    },
    execute(interaction) {
        if (interaction.user.bot) { return; }
        const { options } = interaction;
        sfxFiles = getSfxFiles();

        if (interaction.isCommand()) {
            let sound = options.getString('play');
            if (sound == null) {
                let counter = 0;
                let rowLength = 4;
                while (counter < sfxFiles.length) {
                    let rows = Array();
                    for (let i = counter; i < sfxFiles.length; i += rowLength) {
                        if (rows.length == 5) { break; }
                        let row = new MessageActionRow();
                        let buttons = Array();
                        for (let j = 0; j < rowLength; j++) {
                            let button = new MessageButton();
                            let sfxFile = sfxFiles[i + j];
                            if (!sfxFile) { break; }
                            button.setCustomId("sfx_" + sfxFile.replace(".mp3", ""));
                            button.setLabel(sfxFile.replace(".mp3", ""));
                            button.setStyle('SECONDARY');
                            buttons.push(button);
                            counter += 1;
                            if (counter >= sfxFiles.length) { break; }
                        }
                        row.addComponents(buttons);
                        rows.push(row);
                        if (counter >= sfxFiles.length) { break; }
                    }
                    if (counter <= rowLength * 5) {
                        interaction.reply({
                            embeds: editEmbed ? [new MessageEmbed().setDescription(`**Sound Effects**`)] : [],
                            components: rows
                        });
                    }
                    else { interaction.channel.send({ components: rows }); }
                }
            }
            else {
                let soundExists = false;
                for (let key of sfxFiles) {
                    key = key.replace('.mp3', '');
                    if (sound.toLowerCase() == key) {
                        soundExists = true;
                        sound = key;
                    }
                }
                if (!soundExists) {
                    interaction.reply({
                        content: `"${sound}" is not a valid sound effect.`,
                        ephemeral: true
                    });
                }
                else if (!interaction.member.voice.channel) {
                    interaction.reply({
                        content: "You must be in a voice channel to use sound effects.",
                        ephemeral: true
                    });
                }
                else {
                    const player = createAudioPlayer();
                    let res = createAudioResource("./audio/sfx/" + sound + ".mp3", { inputType: StreamType.Arbitrary });
                    const connection = joinVoiceChannel({
                        channelId: interaction.member.voice.channel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator
                    });
                    connection.subscribe(player);
                    player.play(res);
                    player.on(AudioPlayerStatus.Playing, () => { global.lastTimePlayed = Date.now(); })
                    player.on(AudioPlayerStatus.Idle, () => {
                        setTimeout(() => {
                            if (Date.now() > global.lastTimePlayed + voiceTimeout) { connection.disconnect(); }
                        }, voiceTimeout + 1);
                    });
                    interaction.reply({
                        content: `▶︎ ${utils.upper(sound)} — ${interaction.member.voice.channel.toString()}`
                    });
                }
            }
        }
        // handle Buttons
        else if (interaction.isButton()) {

            // play sfx
            if (interaction.customId.startsWith('sfx_')) {
                interaction.deferUpdate();
                if (!interaction.member.voice.channel) { return; }
                const player = createAudioPlayer();
                const soundPath = './audio/sfx/' + interaction.customId.replace('sfx_', '') + '.mp3';
                if (!fs.existsSync(soundPath)) {
                    return;
                }
                let res = createAudioResource(
                    soundPath,
                    { inputType: StreamType.Arbitrary }
                );
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });
                connection.subscribe(player);
                player.play(res);
                player.on(AudioPlayerStatus.Playing, () => { global.lastTimePlayed = Date.now(); })
                let now = new Date();
                let timecode = now.toLocaleDateString().slice(0, -5) + ", " + now.toLocaleTimeString();
                if (editEmbed && interaction.message.type == 'APPLICATION_COMMAND') {
                    interaction.message.edit({
                        embeds: [
                            new MessageEmbed()
                                .setDescription(`**Sound Effects**`)
                                .setFooter({
                                    text:
                                        `▶︎ ${utils.upper(interaction.customId.replace('sfx_', ''))}`
                                        + ` — ${interaction.user.username}`
                                        + ` — ${timecode}`
                                })]
                    });
                }
                player.on(AudioPlayerStatus.Idle, () => {
                    setTimeout(() => {
                        if (Date.now() > global.lastTimePlayed + voiceTimeout) {
                            connection.disconnect();
                        }
                    }, voiceTimeout + 1);
                });
            }

        }
    }
};
