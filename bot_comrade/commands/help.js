module.exports = {
    name: 'help',
    description: 'Get some help!',
    exec(client, message, cmd, cmdArgs) {
        if (message.author.bot == false){
            if (message.mentions.users.has(client.user.id)) {
                message.channel.send({ content: "I am with you!" });
            }
        }
    }
};
