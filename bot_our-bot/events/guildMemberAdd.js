
const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

module.exports = {
	name: 'guildMemberAdd',
	once: false,
	execute(client, member) {
		utils.checkCreateGuildFiles(client, member.guild.id);
        utils.checkAppendMember(member.guild.id, member);

		if (member.user.bot == false) {
			let channel = client.channels.resolve(member.guild.systemChannelId);
			setTimeout(() => {
				channel.send("Repeat after me, " + member.user.toString() + ":\nI love The Party");
			}, 2500);
		}
	}
}
