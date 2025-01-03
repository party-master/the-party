const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');
const Vote = require (appRoot.path + '/global/objects/vote.js');
const reactionAffirmations = utils.getLines("/global/lists/reactions_affirmations.txt");

module.exports = {
    name: 'messageCreate',
    once: false,
    execute(client, message) {
        if (message.guild) {
            utils.checkCreateGuildFiles(client, message.guild.id);
            utils.checkAppendMember(message.guild.id, message.member);
        }

        // handle self embeds
        if (message.embeds.length && message.author.id == client.user.id) {
            Vote.handleSelfEmbed(client, message);
            return;
        }

        if (message.author.bot) { return; }

        /*
        // handle wrongthink
        else if (utils.searchForLine(message, utils.getLines("/global/lists/phrases_wrongthink.txt"))) {
            const isComrade = utils.isComrade(client, message.member);
            if (isComrade) {
                utils.makeTerrorist(client, message.guild.id, message.author.id, null);
                message.reply(message.author.toString() + " has been sent to re-education.");
            }
            else if (!isComrade && !utils.isTerrorist(client, message.member, null)) {
                utils.makeTerrorist(client, message.guild.id, message.author.id);
                message.reply(message.author.toString() + " is now a terrorist.");
            }
        }
        */
        
        // handle goodthink
        else if (utils.searchForLine(message, utils.getLines("/global/lists/phrases_goodthink.txt"))) {
            utils.makeComrade(client, message.guild.id, message.author.id);
            message.react(utils.randItem(reactionAffirmations));
        }
    }
}