module.exports = {
    name: 'edit',
    exec(client, message, cmdArgs) {
        return;
        if (message.author.bot) { return; }
        if (message.channel.type != 'dm') { return; }
        if (!isNaN(cmdArgs[0]) && cmdArgs[0].length == 18 && !isNaN(cmdArgs[1]) && cmdArgs[1].length == 18) {
            let channel = client.channels.resolve(cmdArgs[0]);
            let msg = channel.messages.fetch(cmdArgs[1]);
            msg.then(msg => { msg.edit(message.content.slice(45)); });                       
        }
    }
}
