module.exports = {
	name: 'guildMemberAdd',
	once: false,
	execute(client, member) {
		if (member.user.bot == false) {
			let channel = client.channels.resolve(member.guild.systemChannelId);
			setTimeout(() => {
				channel.send("Repeat after me, " + member.user.toString() + ":\nI love The Party");
			}, 2500);
		}
	}
}
