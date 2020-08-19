module.exports = {
	name: '!args-info',
	description: 'Command descriptions.',
	execute(message, args) {
		if (!args.length) {
            return message.channel.send(`No arguments provided, ${message.author}! Type !cmd-info to see valid arguments.`);

        } else if (args[0] === `!server-info`) {
            return message.channel.send('Type ' + "'" + '!server-info' + "'" + ' to learn more about the server.');

        } else if (args[0] === `!user-info`) {
            return message.channel.send('Type ' + "'" + '!user-info' + "'" + ' to learn more about yourself.');

        } else if (args[0] === `!args-info`) {
            return message.channel.send('Type ' + "'" + '!args-info' + "'" + ' followed by an command argument to learn more about that command.');

        } else if (args[0] === `!cmd-info`) {
            return message.channel.send('Type ' + "'" + '!cmd-info' + "'" + ' to learn the re-education commands.');

        } else if (args[0] === `!wz-stats`) {
            return message.channel.send('Type ' + "'" + '!wz-stats' + "'" + ' to see global wz stats.');
        }
	},
};