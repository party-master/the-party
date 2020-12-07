const appRoot = require('app-root-path');
const path_root = appRoot.path;

const Discord = require(path_root + '/node_modules/discord.js');
const client = new Discord.Client();
const config = require(path_root + '/bot_re-education/config.json');
const utils = require(path_root + '/utils/functions.js');
const fs = require('fs');
const schedule = require('node-schedule');

const img_party = 'https://i.imgur.com/GRSG1Em.png';
const CMD_PREFIX = "!"

client.on('ready', () => {
    console.log("Re-Education Bot is Online");
    client.user.setPresence({ activity: { type: 'LISTENING', name: 'wails of learning' } });
});

client.on('message', async message => {
    if (message.content.startsWith(CMD_PREFIX)) {
        const cmdArgs = message.content.slice(CMD_PREFIX.length).trim().split(' ');
        const cmd = cmdArgs.shift();
        switch (cmd) {
        }
    }
})

client.login(config.token);
