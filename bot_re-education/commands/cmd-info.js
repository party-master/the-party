module.exports = {
	name: '!help',
	description: 'Displays a list of valid re-education commands.',
	execute(message, args) {
        message.channel.send(`
        Here are a list of re-education commands:
        !help
        !server-info
        !user-info
        !args-info
        !wz-stats
        \nType ` + "'" + '!args-info' + "'" + ` followed by another command to learn more about that command.\n(e.g. !args-info !server-info)`);
	},
};