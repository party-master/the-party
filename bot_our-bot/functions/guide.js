module.exports = {
	name: 'guide',
	exec(client, member, joined) {
		if (joined) {
			if (member.user.bot == false) {
				let channel = client.channels.resolve(member.guild.systemChannelId);
				setTimeout(() => {
					channel.send("Repeat after me, " + member.user.toString() + ":\nI love The Party");
				}, 2500);
			}
		}
	}
}
