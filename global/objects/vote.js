const appRoot = require('app-root-path');
const { InteractionCollector, ThreadMemberFlagsBitField } = require('discord.js');
const { EmbedBuilder } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const schedule = require('node-schedule');

class Vote {
    constructor() { }
    open(client, voteType, interaction) {
        const { commandName, options } = interaction;
        const subject = options.getString('subject');
        const reason = options.getString('reason');
        if (subject != null && subject.length > 500 || reason != null && reason.length > 500) {
            interaction.reply({
                content: "\'Subject\' and \'Reason\' fields must be 500 characters or less.",
                ephemeral: true
            });
            return;
        }

        const variablesPath = appRoot.path + '/guilds/' + interaction.guild.id + '/variables.json'
        const variables = utils.getJSON(variablesPath);
        const amounts = variables['amounts'];
        let pathSuffix;
        switch (voteType) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'vote': pathSuffix = '/votes.json'; break;
            case 'courtcase': pathSuffix = '/courtroom.json'; break;
        }
        const votesPath = appRoot.path + '/guilds/' + interaction.guild.id + pathSuffix;
        const votes = utils.getJSON(votesPath);

        this.details = {};
        this.details.subject = subject != null ? subject : "";
        this.details.reason = reason != null ? reason : "";
        this.voteId = utils.pad(parseInt(votes['latestVote']['id']) + 1, 5);
        this.voteType = voteType
        this.userId = interaction.user.id;
        this.guildId = interaction.guild.id;
        this.channelId = interaction.channel.id;
        this.messageId = interaction.id;
        this.status = 'open';
        this.passed = false;
        this.votesUp = 0;
        this.votesDown = 0;
        this.minVotes = amounts['MIN_VOTES'];
        this.timeOpen = new Date().getTime();

        let duration = options.getNumber('duration');
        if (duration != null) { duration = utils.parseTimeArgs(['mins=' + duration]); }
        else { duration = 0; }
        if (duration == 0 && voteType != 'vote') {
            duration = parseInt(amounts['DEFAULT_VOTE_DURATION']);
            this.timeClose = this.timeOpen + duration;
        }
        this.timeClose = this.timeOpen + duration;
        this.durationStr = utils.msToTimecode(duration);

        let crimeExists;
        switch (this.voteType) {
            case 'courtcase':
                const defendant = options.getUser('user');
                if (defendant.bot) {
                    interaction.reply({
                        content: "Bots are Our friends.",
                        ephemeral: true
                    });
                    return;
                }
                let charge = options.getString('crime');
                crimeExists = false;
                for (let crime of variables['crimes']) {
                    if (charge.toLowerCase() == crime.toLowerCase()) {
                        charge = utils.upper(crime);
                        crimeExists = true;
                        break;
                    }
                }
                if (!crimeExists) {
                    interaction.reply({
                        content: utils.upper(charge) + " is not a crime. Yet.",
                        ephemeral: true
                    });
                    return;
                }
                this.details = {
                    reason: this.details['reason'],
                    plaintiffId: interaction.member.id,
                    defendantId: defendant.id,
                    charge: charge,
                    verdict: "--",
                    archived: false
                };
                break;
            case 'variable':
                let varName = options.getString('variable');
                this.details = {
                    variable: varName,
                    value: options.getNumber('value'),
                    ogValue: amounts[varName],
                    failReason: false
                }
                if (varName == 'REEDUCATION_CHANNEL') {
                    this.details.value = options.getChannel('channel').id;
                    let channel = options.getChannel('channel');
                    if (!channel) {
                        interaction.reply({
                            content: "Channel not found.",
                            ephemeral: true
                        });
                        return;
                    }
                }
                if (varName == 'DEFAULT_VOTE_DURATION') {
                    this.details.value += "ms";
                }
                if (this.details.value === this.details.ogValue) {
                    interaction.reply({
                        content: `${varName} is already set to ${this.details.value}.`,
                        ephemeral: true
                    });
                    return;
                }
                break;
            case 'addcrime':
                let newCrime = options.getString('add');
                if (newCrime.length > 20) {
                    interaction.reply({
                        content: "Crime names must be 20 characters or less.",
                        ephemeral: true
                    });
                    return;
                }
                this.details = { crime: utils.normalizeStr(newCrime) };
                break;

            case 'removecrime':
                let crime = utils.normalizeStr(options.getString('remove'));
                crimeExists = false;
                for (let _crime of variables['crimes']) {
                    if (crime.toLowerCase() == _crime.toLowerCase()) {
                        crimeExists = true;
                        break;
                    }
                }
                if (!crimeExists) {
                    interaction.reply({
                        content: `"${crime}" is not a crime.`,
                        ephemeral: true
                    });
                    return;
                }
                this.details = { crime: crime };
                break;
        }

        votes['latestVote']['id'] = this.voteId;
        if (this.timeOpen == this.timeClose) {
            this.status = 'closed';
            votes['closed'][this.voteId] = this.json();
            votes['latestVote']['status'] = 'closed';
        }
        else {
            this.status = 'open';
            votes['open'][this.voteId] = this.json();
            votes['latestVote']['status'] = 'open';
        }
        utils.setJSON(votesPath, votes);
        interaction.reply({ embeds: [this.embed(client, interaction.guildId)] });
    }
    close(client) {
        let votesPath;
        switch (this.voteType) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'vote':
                votesPath = appRoot.path + '/guilds/' + this.guildId + '/votes.json';
                break;
            case 'courtcase':
                votesPath = appRoot.path + '/guilds/' + this.guildId + '/courtroom.json';
                break;
        }
        const votes = utils.getJSON(votesPath);
        const guild = client.guilds.resolve(this.guildId);
        if (guild == null) {
            console.log("Removed from guild " + this.guildId + ", cannot close vote " + this.voteId + ".");
            return;
        }
        const channel = guild.channels.resolve(this.channelId);
        channel.messages.fetch(this.messageId).then(msg => {
            const reactions = Array.from(msg.reactions.cache.values());
            const emojis = reactions.map(reaction => { return reaction.emoji.name; })
            for (let i = 0; i < emojis.length; i++) {
                if (emojis[i] == '👍') {
                    this.votesUp = reactions[i].count - 1;
                    reactions[i].users.remove(client.user);
                }
                else if (emojis[i] == '👎') {
                    this.votesDown = reactions[i].count - 1;
                    reactions[i].users.remove(client.user);
                }
            }
            switch (this.voteType) {
                case 'vote':
                    if (this.votesUp > this.votesDown && this.votesUp >= this.minVotes) {
                        this.passed = true;
                    }
                    break;
                case 'courtcase':
                    if (this.votesUp > this.votesDown && this.votesUp >= this.minVotes) {
                        this.passed = true;
                        this.details['verdict'] = 'Guilty';
                        utils.makeTerrorist(client, msg.guild.id, this.details['defendantId'], this);
                    }
                    else {
                        this.details['verdict'] = 'Not Guilty';
                    }
                    break;
                case 'variable':
                    if (this.votesUp > this.votesDown && (this.votesUp >= this.minVotes || this.details['variable'] == 'MIN_VOTES')) {
                        const variablesPath = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(variablesPath);
                        const amounts = variables['amounts'];
                        if (this.details['variable'] == 'minVotes' && this.votesUp + this.votesDown < this.details['value']) {
                            this.details['failReason'] = "The total number of votes must amount to the new value."
                            break;
                        }
                        this.passed = true;
                        amounts[this.details['variable']] = this.details['value'];
                        utils.setJSON(variablesPath, variables);
                    }
                    break;
                case 'addcrime':
                    if (this.votesUp > this.votesDown && this.votesUp >= this.minVotes) {
                        this.passed = true;
                        const variablesPath = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(variablesPath);
                        let crimes = variables['crimes'];
                        crimes.push(this.details['crime'].toLowerCase());
                        variables['crimes'] = crimes;
                        utils.setJSON(variablesPath, variables);
                    }
                    break;
                case 'removecrime':
                    if (this.votesUp > this.votesDown && this.votesUp >= this.minVotes) {
                        this.passed = true;
                        const variablesPath = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(variablesPath);
                        let crimes = variables['crimes'];
                        crimes = utils.removeItemOnce(crimes, this.details['crime'].toLowerCase());
                        variables['crimes'] = crimes;
                        utils.setJSON(variablesPath, variables);
                    }
                    break;
            }
            if (msg.author.id == client.user.id) {
                this.status = 'closed';
                msg.edit({ embeds: [this.embed(client, msg.guildId)] });
                this.details['archived'] = true;

                delete votes['open'][this.voteId];
                votes['closed'][this.voteId] = this;
                utils.setJSON(votesPath, votes);
            }

        }).catch(() => {
            delete votes['open'][this.voteId];
            utils.setJSON(votesPath, votes);
        });
    }
    embed(client, guildId) {
        const embedVote = new EmbedBuilder();
        let guild;
        switch (this.voteType) {
            case 'vote':
                embedVote.setTitle("VOTE");
                embedVote.setDescription(this.details['subject']);
                if (this.details['reason'] && this.details['reason'].replaceAll(" ", "") != "") {
                    embedVote.addFields({
                        name: "Reason:",
                        value: this.details['reason'],
                        inline: false
                    });
                }
                if (this.status == 'open' && this.timeOpen != this.timeClose) {
                        embedVote.setFooter({ text: "Duration: " + this.durationStr });
                }
                else if (this.status == 'closed' && this.timeOpen != this.timeClose) {
                        embedVote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" });
                }
                return embedVote;
            case 'variable':
                embedVote.setTitle("VOTE");
                if (this.details.variable == 'REEDUCATION_CHANNEL') {
                    guild = client.guilds.resolve(this.guildId);
                    let newChannel = guild.channels.cache.find(channel => channel.id === this.details.value);
                    let ogChannel = guild.channels.cache.find(channel => channel.id === this.details.ogValue);
                    embedVote.addFields(
                        {
                            name: "Set Variable:",
                            value: `${this.details['variable']}`
                                + (ogChannel ? "\nFrom " + ogChannel.toString() : '')
                                + " to " + newChannel.toString(),
                            inline: false
                        }
                    );
                }
                else {
                    embedVote.addFields(
                        {
                            name: "Set Variable:",
                            value: `${this.details['variable']}`
                                + "\nFrom " + this.details['ogValue']
                                + " to " + this.details['value'],
                            inline: false
                        }
                    );
                }
                if (this.status == 'open') {
                    embedVote.setFooter({ text: "Duration: " + this.durationStr });
                    return embedVote;
                }
                else if (this.status == 'closed') {
                    if (this.details['failReason']) {
                        const footer = {
                            text: this.passed ? "Vote Passed" : "Vote Failed"
                                + "\n" + this.details['failReason']
                        };
                        embedVote.setFooter(footer);
                    }
                    else {
                        embedVote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" });
                    }
                    return embedVote;
                }
                break;
            case 'courtcase':
                guild = client.guilds.resolve(this.guildId);
                const defendant = client.users.resolve(this.details['defendantId']);
                embedVote.setTitle(`${guild.name} v. ` + defendant.displayName);
                embedVote.setFooter({ text: "Duration: " + this.durationStr + "\nCase #" + this.voteId, iconURL: guild.iconURL() });
                embedVote.addFields(
                    {
                        name: "Plaintiff:",
                        value: client.users.resolve(this.details['plaintiffId']).toString(),
                        inline: true
                    },
                    {
                        name: "Defendant:",
                        value: defendant.toString(),
                        inline: true
                    }
                )

                if (this.status == 'open') {
                    if (this.details['reason'] && this.details['reason'].replaceAll(" ", "") != "") {
                        embedVote.addFields(
                            {
                                name: "Charge:",
                                value: this.details['charge'],
                                inline: this.details['reason'].length > 60 ? true : false
                            },
                            {
                                name: "Reason:",
                                value: this.details['reason'],
                                inline: false
                            }
                        );
                    }
                    else {
                        embedVote.addFields(
                            {
                                name: "Charge:",
                                value: this.details['charge'],
                                inline: false
                            }
                        );
                    }

                }
                else if (this.status == 'closed') {
                    embedVote.addFields({
                        name: "Charge:",
                        value: this.details['charge'],
                        inline: this.details['reason'].length > 60 ? true : false
                    });
                    if (this.details['reason'] && this.details['reason'].replaceAll(" ", "") != "") {
                        embedVote.addFields({
                            name: "Reason:",
                            value: this.details['reason'],
                            inline: false
                        });
                    }
                    embedVote.addFields({
                        name: "Verdict:",
                        value: this.details['verdict'] + " — NG: " + this.votesDown + ", G: " + this.votesUp,
                        inline: false
                    });
                    if (this.details['verdict'] == "Guilty") { embedVote.setColor("#ff9f49") }
                    else { embedVote.setColor("#70c2e9"); }
                }
                return embedVote;
            case 'addcrime':
            case 'removecrime':
                embedVote.setTitle("VOTE");
                embedVote.addFields(
                    {
                        name: (this.voteType == 'addcrime') ? "Add Crime:" : "Remove Crime:",
                        value: this.details['crime'],
                        inline: false
                    }
                );
                switch (this.status) {
                    case 'open': embedVote.setFooter({ text: "Duration: " + this.durationStr }); break;
                    case 'closed': embedVote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" }); break;
                }
                return embedVote;
        }
    }
    json() {
        return {
            voteType: this.voteType,
            voteId: this.voteId,
            userId: this.userId,
            guildId: this.guildId,
            channelId: this.channelId,
            messageId: this.messageId,
            status: this.status,
            passed: this.passed,
            votesUp: this.votesUp,
            votesDown: this.votesDown,
            minVotes: this.minVotes,
            durationStr: this.durationStr,
            timeOpen: this.timeOpen,
            timeClose: this.timeClose,
            details: this.details
        };
    }
    assign(voteData) {
        const jsonkeys = this.json();
        for (let key in jsonkeys) { this[key] = voteData[key]; }
    }
}

module.exports = {
    new() {
        const vote = new Vote;
        return vote;
    },
    open(client, voteType, interaction) {
        const vote = new Vote;
        vote.open(client, voteType, interaction);
        return vote;
    },
    handleSelfEmbed(client, message) {
        if (!message.embeds.length || message.author.id != client.user.id) { return; }
        function beginVoting(voteType) {
            message.react('👍');
            message.react('👎');

            let votesPath;
            switch (voteType) {
                case 'vote': votesPath = appRoot.path + '/guilds/' + message.guild.id + '/votes.json'; break;
                case 'courtcase': votesPath = appRoot.path + '/guilds/' + message.guild.id + '/courtroom.json'; break;
            }
            const votes = utils.getJSON(votesPath);
            const latestStatus = votes['latestVote']['status'];
            const latestId = votes['latestVote']['id'];
            const voteData = votes[latestStatus][latestId];
            voteData.messageId = message.id;
            const vote = new Vote;
            vote.assign(voteData);
            vote.messageId = message.id;
            if (vote.status == 'open') { votes['open'][votes['latestVote']['id']]['messageId'] = message.id; }
            else { votes['closed'][votes['latestVote']['id']]['messageId'] = message.id; }
            utils.setJSON(votesPath, votes);
            return vote;
        }
        if (typeof (message.embeds[0]['title']) == 'undefined') { return false; }
        if (message.embeds[0]['title'] && message.embeds[0]['title'].startsWith(`${client.guilds.resolve(message.guildId).name} v.`)) {
            const vote = beginVoting('courtcase');
            if (!vote) { return; }
            schedule.scheduleJob(vote.timeClose, function () { vote.close(client); });
        }
        else if (message.embeds[0]['title'] && message.embeds[0]['title'].startsWith("VOTE")) {
            const vote = beginVoting('vote');
            if (!vote) { return; }
            if (vote.timeOpen != vote.timeClose) {
                schedule.scheduleJob(vote.timeClose, function () { vote.close(client); });
            }
        }
    }
}
