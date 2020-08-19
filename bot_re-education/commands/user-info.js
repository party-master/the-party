module.exports = {
	name: '!user-info',
	description: 'Gives a summary of the user calling the command.',
	execute(message, args) {
		message.channel.send(`Your username: ${message.author.username}
        Your ID: ${message.author.id}
        Discord Tag: ${message.author.tag}
        Joined Discord On: ${message.author.createdAt}`);
	},
};