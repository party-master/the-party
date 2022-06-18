const appRoot = require('app-root-path');
const { Collection } = require(appRoot.path + '/node_modules/discord.js');
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
const { disconnect } = require('process');

const sfxPath = appRoot.path + '/audio/sfx/';
let timeout = 20000;

module.exports = {
    name: 'sfx',
    description: 'Play a sound effect to the voice channel.',
    exec(client, message, cmd, cmdArgs) {

        // update sfx commands
        let triggerReturn = true;
        const sfxFiles = fs.readdirSync(sfxPath).filter(file => file.endsWith('.mp3'));
        client.sfxCommands = new Collection();
        for (let file of sfxFiles) {
            let sfx = utils.lower(file.slice(0, -4));
            client.sfxCommands.set(sfx, require(`${client.cmdsPath}sfx.js`));
            if (cmd == sfx) { triggerReturn = false; }
        }
        if (triggerReturn) { return; }

        // play sfx
        try {
            if (message.author.bot == false && cmd != 'sfx'){
                if (!message.member.voice.channel) return;
                const player = createAudioPlayer();
                let res = createAudioResource("./audio/sfx/" + cmd + ".mp3", { inputType: StreamType.Arbitrary });
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator
                });
                connection.subscribe(player);
                player.play(res);
                player.on(AudioPlayerStatus.Playing, () => { global.lastTimePlayed = Date.now(); })
                player.on(AudioPlayerStatus.Idle, () => {
                    setTimeout(() => { 
                        if (Date.now() > global.lastTimePlayed + timeout) { connection.disconnect(); }
                    }, timeout + 1);
                });
            }
        }
        catch (error) { console.log(error); }
    }
};
