module.exports = {
	name: '!help',
	description: 'Gives a summary of the server bots with commands.',
	execute(message, args) {
        message.channel.send(`Tag any bot to learn their commands.
        Bots:
        Historian
        Comrade
        Re-education`);
	},
};