const appRoot = require('app-root-path');
const { Discord, Collection, VoiceBasedChannel, VoiceChannel } = require(appRoot.path + '/node_modules/discord.js');
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

const path_sfx = appRoot.path + '/audio/sfx/';
let timeout = 30000;

module.exports = {
    name: 'sfx',
    description: 'Play a sound effect to the voice channel.',
    exec(client, message, cmd, cmdArgs) {

        // update sfx commands
        let trigger_return = true;
        const sfx_files = fs.readdirSync(path_sfx).filter(file => file.endsWith('.mp3'));
        client.sfx_commands = new Collection();
        for (let file of sfx_files) {
            let sfx = utils.lower(file.slice(0, -4));
            client.sfx_commands.set(sfx, require(`${client.path_cmds}sfx.js`));
            if (cmd == sfx) { trigger_return = false; }
        }
        if (trigger_return) { return; }

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
