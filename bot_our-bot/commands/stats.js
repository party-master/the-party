const appRoot = require('app-root-path');
const { EmbedBuilder } = require(appRoot.path + '/node_modules/discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');

function embedUserStats(interaction, user, stats, isHidden) {
    const statsEmbed = new EmbedBuilder();
    statsEmbed.setTitle(user.globalName ? user.globalName : user.username);

    let crimeNames = Object.keys(stats.crimes);
    crimeNames.sort();
    if (crimeNames != 0) {
        let crimesInfo = Array();
        for (let i = 0; i < crimeNames.length; i++) {
            crimesInfo.push(crimeNames[i] + ": " + stats.crimes[crimeNames[i]])
        }
        let numCrimes = Object.values(stats.crimes).reduce((a, b) => a + b, 0);
        let title = numCrimes + (numCrimes == 1 ? ' Crime:' : ' Crimes:');
        utils.makeEmbedColumns(6, 1, 3, crimesInfo, title, statsEmbed);
    }

    let description = "";
    for (let vote in stats.votes) {
        if ((!stats.votes[vote] && vote != 'convictions') || !stats.votes.court_cases && vote == 'convictions') { continue; }
        let keywordSplit = vote.toString().split('_');
        description += "\n";
        for (let word of keywordSplit) {
            description += (word == keywordSplit[0] ? "" : " ") + utils.upper(word);
        }
        description += ": " + stats.votes[vote] + (vote == 'convictions' ? ` (${Math.round(stats.votes.convictions / stats.votes.court_cases * 100)}%)` : '');
    }

    if (!crimeNames.length && !description.length) {
        statsEmbed.setDescription('No stats for this user.')
        interaction.reply({
            embeds: [statsEmbed],
            ephemeral: isHidden == null ? false : isHidden
        });
        return;
    }

    if (description.length) { statsEmbed.setDescription(description); }

    interaction.reply({
        embeds: [statsEmbed],
        ephemeral: isHidden == null ? false : isHidden
    });
    return;
}

async function embedLeaderboard(interaction, stats, isHidden) {
    const lbEmbed = new EmbedBuilder();
    lbEmbed.setTitle("Crime Stats");
    lbEmbed.setDescription(
        "Court Cases: " + stats.numCourtcases
        + "\nConvictions: " + stats.numConvictions + (stats.numConvictions ? " (" + Math.round(stats.numConvictions / stats.numCourtcases * 100) + "%)" : " (0%)")
    );
    const guildUsers = utils.getJSON(appRoot.path + '/guilds/' + interaction.guild.id + "/users.json");
    const lb = [
        {
            name: 'Most Convictions',
            property: 'convictions',
            numItems: 5,
            list: stats.users,
            top: [],
            string: "",
            inline: true,
            isUser: true,
            updateString() {
                this.string = "";
                let trigger = 0;
                while (!trigger) {  // sort equal conviction counts by conviction rate
                    trigger = 1;
                    for (let i = 0; i < this.top.length; i++) {
                        if (!i) { continue; }
                        if (this.top[i].value == this.top[i-1].value) {
                            let rate = this.top[i].value / this.top[i].court_cases;
                            let ratePrev = this.top[i-1].value / this.top[i-1].court_cases;
                            if (rate > ratePrev) {
                                let temp = Object(this.top[i-1]);
                                this.top[i-1] = Object(this.top[i]);
                                this.top[i] = temp;
                                trigger = 0;
                            }
                        }
                    }
                }
                for (let i = 0; i < this.numItems; i++) {
                    let rate = Math.round(this.top[i].value / this.top[i].court_cases * 100);
                    this.string += (i + 1) + ". " + (this.top[i].success ? this.top[i].name + ": " + (this.top[i].value + "/" + this.top[i].court_cases + ` (${rate}%)`) : "—");
                    if (i != this.numItems - 1) { this.string += "\n"; }
                } 
                return this.string;
            }
        },
        {
            name: 'Most Convicted',
            property: 'convicted',
            numItems: 5,
            list: stats.users,
            top: [],
            string: "",
            inline: true,
            isUser: true,
            updateString() {
                this.string = "";
                for (let i = 0; i < this.numItems; i++) {
                    this.string += (i + 1) + ". " + (this.top[i].success ? this.top[i].name + ": " + this.top[i].value : "—");
                    if (i != this.numItems - 1) { this.string += "\n"; }
                } 
                return this.string;
            }
        },
        {
            name: 'Top Crimes',
            property: 'amount',
            numItems: 5,
            list: stats.crimes,
            top: [],
            string: "",
            inline: false,
            isUser: false,
            updateString() {
                this.string = "";
                for (let i = 0; i < this.numItems; i++) {
                    this.string += (i + 1) + ". " + (this.top[i].success ? this.top[i].name + ": " + this.top[i].value + " (" + Math.round(this.top[i].value / stats.numConvictions * 100) + "%)": "—");
                    if (i != this.numItems - 1) { this.string += "\n"; }
                }
                return this.string;
            },
        }
    ];
    for (let i = 0; i < lb.length; i++) {
        let topItems = [];
        for (let j = 0; j < lb[i].numItems; j++) {
            let topItem = null;
            let maxValue = 0;
            for (let item in lb[i].list) {
                if (topItems.includes(item)) { continue; }
                if (lb[i].list[item][lb[i].property] > maxValue) {
                    if (lb[i].isUser) {
                        if (!guildUsers[item]) {
                            continue;  // user not in users.json, skipping.
                        }
                    }
                    topItem = item;
                    maxValue = lb[i].list[item][lb[i].property];
                }
            }
            if (!topItem) {
                lb[i].top.push({
                    success: false,
                    name: '—',
                    court_cases: 0,
                    value: 0
                });
            }
            else {
                if (lb[i].isUser) {
                    let user = guildUsers[topItem];
                    lb[i].top.push({
                        success: true,
                        name: user.globalName ? user.globalName : user.username,
                        court_cases: lb[i].list[topItem].court_cases,
                        value: lb[i].list[topItem][lb[i].property]
                    });
                    topItems.push(topItem);
                }
                else {
                    lb[i].top.push({
                        success: true,
                        name: topItem,
                        court_cases: lb[i].list[topItem].court_cases,
                        value: lb[i].list[topItem][lb[i].property]
                    });
                    topItems.push(topItem);
                }
            }
        }
        lbEmbed.addFields({ name: "__" + lb[i].name + "__", value: lb[i].updateString(), inline: lb[i].inline });
    }

    interaction.reply({
        embeds: [lbEmbed],
        ephemeral: isHidden == null ? false : isHidden
    });
}

function getUserStats(user, courtcases, votes) {
    let stats = {
        crimes: {},
        votes: {
            court_cases: 0,
            convictions: 0,
            crimes_added: 0
        }
    }
    for (let courtcaseId in courtcases.closed) {
        let courtcase = courtcases.closed[courtcaseId];

        if (courtcase.userId == user.id) {
            stats.votes.court_cases += 1;
            if (courtcase.details.verdict == 'Guilty') {
                stats.votes.convictions += 1;
            }
        }
        if (user.id == courtcase.details.defendantId && courtcase.details.verdict == 'Guilty') {
            let crime = courtcase.details.charge;
            if (typeof stats.crimes[crime] == 'undefined') { stats.crimes[crime] = 1; }
            else { stats.crimes[crime] += 1; }
        }
    }
    for (let voteId in votes.closed) {
        let vote = votes.closed[voteId];
        if (vote.userId != user.id) { continue; }
        if (!vote.passed) { continue; }
        else if (vote.voteType == 'addcrime') {
            stats.votes.crimes_added += 1;
        }
    }
    return stats;
}

function LbCheckAppendUser(stats, userId) {
    if (!stats.users[userId]) {
        stats.users[userId] = {
            crimes: {},
            court_cases: 0,
            convictions: 0,
            convicted: 0,
            crimes_added: 0
        }
    };
    return stats;
}

function LbCheckAppendCrime(stats, crime) {
    if (!stats.crimes[crime]) {
        stats.crimes[crime] = {
            amount: 0
        };
    }
    return stats;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Get the leaderboard or user stats.')
        .addUserOption((option) => slashOptions.user(option, false))
        .addBooleanOption((option) => slashOptions.hidden(option, false)),
    execute(client, interaction) {
        const { options } = interaction;
        let user = options.getUser('user');

        const courtcasesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/courtroom.json';
        const courtcases = utils.getJSON(courtcasesPath);

        let stats;
        if (user == null) {
            stats = {
                numCourtcases: 0,
                numConvictions: 0,
                crimes: {},
                users: {}
            }
            for (let courtcaseId in courtcases.closed) {
                let courtcase = courtcases.closed[courtcaseId];
                stats.numCourtcases += 1;
                stats = LbCheckAppendUser(stats, courtcase.details.plaintiffId);
                stats = LbCheckAppendUser(stats, courtcase.details.defendantId);
                stats.users[courtcase.details.plaintiffId].court_cases += 1;

                if (!courtcase.passed) { continue; }

                stats.numConvictions += 1;
                stats.users[courtcase.details.plaintiffId].convictions += 1;
                stats.users[courtcase.details.defendantId].convicted += 1;
                stats = LbCheckAppendCrime(stats, courtcase.details.charge);
                stats.crimes[courtcase.details.charge].amount += 1;
                if (!stats.users[courtcase.details.defendantId].crimes[courtcase.details.charge]) {
                    stats.users[courtcase.details.defendantId].crimes[courtcase.details.charge] = 1;
                }
                else {
                    stats.users[courtcase.details.defendantId].crimes[courtcase.details.charge] += 1;
                }
            }
            embedLeaderboard(interaction, stats, options.getBoolean('hidden'));
        }
        else {
            const votesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/votes.json';
            const votes = utils.getJSON(votesPath);
            stats = getUserStats(user, courtcases, votes);
            embedUserStats(interaction, user, stats, options.getBoolean('hidden'));
        }
    }
}
