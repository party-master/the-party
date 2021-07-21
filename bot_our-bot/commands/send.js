module.exports = {
    name: 'send',
    exec(client, message, cmdArgs) {
        if (message.author.bot) { return; }
        if (message.channel.type != 'dm') { return; }
        if (!isNaN(cmdArgs[0]) && cmdArgs[0].length == 18) {
            let channel = client.channels.resolve(cmdArgs[0]);
            if (!channel) return;
            channel.send(message.content.slice(24));
        }
    }
}
