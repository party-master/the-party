module.exports = {
	name: 'guide',
	exec(client, member, joined) {
		let channel;
		if (joined) { channel = client.channels.resolve(member.guild.systemChannelID); }
		else { channel = client.channels.resolve(member.lastMessageChannelID); }
		if (member.user.bot == false) {
			channel.send("Repeat after me, " + member.user.toString() + ":\nI love The Party");
		}
	}
}
