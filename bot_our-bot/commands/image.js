module.exports = {
    name: 'image',
    exec(client, message, cmdArgs) {
        if (message.author.bot) { return; }
        if (message.channel.type != 'dm') { return; }
        if (!isNaN(cmdArgs[0]) && cmdArgs[0].length == 18) {
            let channel = client.channels.resolve(cmdArgs[0]);
            let path_image = './res/images/posters/' + message.content.slice(26);
            channel.send("", {files: [path_image]});
        }
    }
}
