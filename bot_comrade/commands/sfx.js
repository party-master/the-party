const appRoot = require('app-root-path');
const Discord = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const fs = require('fs');

const path_sfx = appRoot.path + '/audio/sfx/';

module.exports = {
    name: 'sfx',
    description: 'Play a sound effect to the voice channel.',
    exec(client, message, cmd, cmdArgs) {

        // update sfx commands
        let trigger_return = true;
        const sfx_files = fs.readdirSync(path_sfx).filter(file => file.endsWith('.mp3'));
        client.sfx_commands = new Discord.Collection();
        for (let file of sfx_files) {
            let sfx = utils.lower(file.slice(0, -4));
            client.sfx_commands.set(sfx, require(`${client.path_cmds}sfx.js`));
            if (cmd == sfx) { trigger_return = false; }
        }
        if (trigger_return) { return; }

        // sfx sfx
        if (message.author.bot == false && cmd != 'sfx'){
            if (!message.member.voice.channel) return;  // User not in voice channel
            message.member.voice.channel.join()
            .then(VoiceConnection => { 
                VoiceConnection.play("./audio/sfx/" + cmd + ".mp3") 
                .on("finish", () => VoiceConnection.disconnect());
            })
            .catch(e => console.log(e));
        }
    }
};
