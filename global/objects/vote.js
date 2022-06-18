const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const schedule = require('node-schedule');

class Vote {
    constructor() { }
    open(client, voteType, message, cmdArgs) {
        const variablesPath = appRoot.path + '/guilds/' + message.guild.id + '/variables.json'
        let variables = utils.getJSON(variablesPath);
        let amounts = variables['amounts'];

        let pathSuffix;
        switch (voteType) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'vote': pathSuffix = '/votes.json'; break;
            case 'courtcase': pathSuffix = '/courtroom.json'; break;
        }
        const votesPath = appRoot.path + '/guilds/' + message.guild.id + pathSuffix;
        const votes = utils.getJSON(votesPath);

        this.details = { desc: "" };
        if (cmdArgs.length != 0) {
            let trigger = false;
            const timeUnits = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
            for (let arg of cmdArgs) {
                for (let unit of timeUnits) {
                    if (arg.startsWith(unit + "=")) { trigger = true; break; }
                }
                if (trigger) { continue; }
                if (arg === cmdArgs[0]) { this.details['desc'] += arg; }
                else { this.details['desc'] += " " + arg; }
            }
        }
        this.voteId = utils.pad(parseInt(votes['latestVote']['id']) + 1, 5);
        this.voteType = voteType
        this.userId = message.author.id;
        this.guildId = message.guild.id;
        this.channelId = message.channel.id;
        this.messageId = message.id;
        this.status = 'open';
        this.passed = false;
        this.votesUp = 0;
        this.votesDown = 0;
        this.minVotes = amounts['min_votes'];

        let duration = utils.parseTimeArgs(cmdArgs);
        if (isNaN(duration)) { message.channel.send(duration); return; }
        this.timeOpen = new Date().getTime();
        if (duration == 0 && voteType != 'vote') {
            duration = parseInt(amounts['default_vote_duration']);
            this.timeClose = this.timeOpen + duration;
        }
        this.timeClose = this.timeOpen + duration;
        this.durationStr = utils.msToTimecode(duration);

        if (this.voteType == 'courtcase') {
            const users = Array();
            message.mentions.users.map(user => users.push(user));
            if (users.length == 0) { return; }
            if (users.length > 0) {
                var defendants = new Array();
                var bots = new Array();
                for (let i = 0; i < users.length; i++) {
                    if (users[i].bot) { bots.push(users[i]); }
                    else if (users[i].bot == false) { defendants.push(users[i]); }
                }
                const defendantIds = defendants.map(user => { return user.id; });
                if (defendants.length > 0) {
                    let crimes = variables['crimes'];

                    let charge = false;
                    let sliced = "That"
                    for (let arg of cmdArgs) {
                        if (arg.startsWith('crime=')) {
                            charge = "none";
                            sliced = arg.slice(6, arg.length).toLowerCase().trim();
                            for (let crime of crimes) {
                                if (sliced == crime.toLowerCase()) {
                                    charge = utils.upper(sliced);
                                }
                            }
                            break;
                        }
                    }
                    if (!charge) {
                        message.channel.send(
                            "You must use the crime keyword, Comrade.\n"
                            + "crime=crime_name\n"
                            + "Use !crimes to get the list of crimes."
                        );
                        return;
                    }
                    if (charge == "none") {
                        message.channel.send("\"" + utils.upper(sliced) + "\"" + " is not a crime. Yet.");
                        return;
                    }
                    this.details = {
                        desc: this.details['desc'],
                        plaintiffId: message.member.id,
                        defendantIds: defendantIds,
                        charge: charge,
                        verdict: "--",
                        archived: false
                    };
                }
                else if (bots.length > 0) {
                    message.channel.send("Bots are Our friends.");
                    return;
                }
            }
        }
        else if (this.voteType == 'variable') {
            this.details = {
                variable: cmdArgs[0],
                value: cmdArgs[1],
                ogValue: amounts[cmdArgs[0]],
                reason: false
            }
            if (cmdArgs[0] == 'default_vote_duration') {
                this.details.ogValue += " (ms)"
            }
            else if (cmdArgs[0] == 'min_edu_duration') {
                this.details.ogValue += " (ms)"
            }
        }
        else if (this.voteType == 'addcrime' || this.voteType == 'removecrime') {
            this.details = {
                crime: cmdArgs[1]
            }
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
        message.channel.send({ embeds: [this.embed(client)] });
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
        let votes = utils.getJSON(votesPath);
        let guild = client.guilds.resolve(this.guildId);
        let channel = guild.channels.resolve(this.channelId);
        let msgPromise = channel.messages.fetch(this.messageId);
        msgPromise.then(msg => {
            let reactions = Array.from(msg.reactions.cache.values());
            let emojis = reactions.map(reaction => { return reaction.emoji.name; })
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
                        for (let userId of this.details['defendantIds']) {
                            utils.makeTerrorist(client, msg.guild.id, userId);
                        }
                    }
                    else {
                        this.details['verdict'] = 'Not Guilty';
                    }
                    break;
                case 'variable':
                    if (this.votesUp > this.votesDown && this.votesUp >= this.minVotes) {
                        const variablesPath = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(variablesPath);
                        const amounts = variables['amounts'];
                        if (this.details['variable'] == 'minVotes' && this.votesUp + this.votesDown < this.details['value']) {
                            this.details['reason'] = "The total number of votes must amount to the new value."
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
            this.status = 'closed';
            msg.edit({embeds: [this.embed(client)] });
            this.details['archived'] = true;

            delete votes['open'][this.voteId];
            votes['closed'][this.voteId] = this;
            utils.setJSON(votesPath, votes);

        }).catch(error => console.log(error));
    }
    embed(client) {
        let embedVote = new MessageEmbed();
        switch (this.voteType) {
            case 'vote':
                embedVote.setTitle("VOTE");
                if (this.status == 'open') {
                    embedVote.setDescription(this.details['desc']);  // add conditional?
                    if (this.timeOpen != this.timeClose) {
                        embedVote.setFooter({ text: "Duration: " + this.durationStr });
                    }
                    return embedVote;
                }
                else if (this.status == 'closed') {
                    embedVote.setDescription(this.details['desc'])
                    if (this.timeOpen != this.timeClose) {
                        embedVote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" });
                    }
                    return embedVote;
                }
                break;
            case 'variable':
                embedVote.setTitle("VOTE");
                embedVote.addFields(
                    {
                        name: "__Set Variable__",
                        value: this.details['variable']
                            + "\nFrom: " + this.details['ogValue']
                            + "\nTo: " + this.details['value'],
                        inline: false
                    }
                );
                if (this.status == 'open') {
                    embedVote.setFooter({ text: "Duration: " + this.durationStr });
                    return embedVote;
                }
                else if (this.status == 'closed') {
                    if (this.details['reason']) {
                        let footer = {
                            text: this.passed ? "Vote Passed" : "Vote Failed"
                                + "\n" + this.details['reason']
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
                const defendants = this.details['defendantIds'].map(id => { return client.users.resolve(id); });
                const defendantUsernames = defendants.map(user => { return user.username; });
                embedVote.setTitle("The Party v. " + defendantUsernames);
                embedVote.setFooter({ text: "Case Number: " + this.voteId + "\nBrought to you by The Party", iconURL: globals.imgParty });
                embedVote.addFields(
                    {
                        name: "Plaintiff:",
                        // value: client.users.resolve(this.details['plaintiffId']),
                        // value: this.details['plaintiffId'],
                        value: client.users.resolve(this.details['plaintiffId']).toString(),
                        inline: true
                    },
                    {
                        name: "Defendants:",
                        value: defendants.join("\n"),
                        inline: true
                    }
                )
                
                if (this.status == 'open') {
                    
                    embedVote.addFields(
                        {
                            name: "Charge:",
                            value: this.details['charge'] + "\n"
                                + "\nTrial Duration: " + this.durationStr
                                + "\nMin Votes Guilty: " + this.minVotes,
                            inline: false
                        }
                    );
                    
                }
                else if (this.status == 'closed') {
                    const dateOpen = new Date(this.timeOpen);
                    const dateClose = new Date(this.timeClose);
                    embedVote.setDescription("closed");
                    embedVote.addFields(
                        {
                            name: "Charge:",
                            value: this.details['charge'],
                            inline: false
                        },
                        {
                            name: "Verdict:",
                            value: this.details['verdict'],
                            inline: false
                        },
                        {
                            name: "Votes:",
                            value: "NG: " + this.votesDown
                                + ", G: " + this.votesUp
                                + " (Min Needed: " + this.minVotes + ")"
                                + "\n"
                                + "\nOpen: " + dateOpen.toLocaleDateString() + " " + dateOpen.toLocaleTimeString()
                                + "\nClose: " + dateClose.toLocaleDateString() + " " + dateClose.toLocaleTimeString(),
                            inline: false
                        }
                    );
                    if (this.details['verdict'] == "Guilty") { embedVote.setColor("#ff9f49") }
                    else { embedVote.setColor("#70c2e9") }
                }
                return embedVote;
            case 'addcrime':
            case 'removecrime':
                embedVote.setTitle("VOTE");
                embedVote.addFields(
                    {
                        name: (this.voteType == 'addcrime') ? "__Add Crime__" : "__Remove Crime__",
                        value: utils.upper(this.details['crime']),
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
    assign(voteData){
        let jsonkeys = this.json();
        for (let key in jsonkeys) { this[key] = voteData[key]; }
    }
}

module.exports = {
    new() {
        let vote = new Vote;
        return vote;
    },
    open(client, voteType, message, cmdArgs) { 
        let vote = new Vote;
        vote.open(client, voteType, message, cmdArgs);
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
            let votes = utils.getJSON(votesPath);
            let latestStatus = votes['latestVote']['status'];
            let latestId = votes['latestVote']['id'];
            let voteData = votes[latestStatus][latestId];
            let vote = new Vote;
            vote.assign(voteData);
            vote.messageId = message.id;
            if (vote.status == 'open') { votes['open'][votes['latestVote']['id']]['messageId'] = message.id; }
            else { votes['closed'][votes['latestVote']['id']]['messageId'] = message.id; }
            utils.setJSON(votesPath, votes);
            return vote;
        }
        if (typeof (message.embeds[0]['title']) == 'undefined') { return false; }
        if (message.embeds[0]['title'] && message.embeds[0]['title'].startsWith("The Party v.")) {
            let vote = beginVoting('courtcase');
            if (!vote) { return; }
            schedule.scheduleJob(vote.timeClose, function () { vote.close(client); });
        }
        else if (message.embeds[0]['title'] && message.embeds[0]['title'].startsWith("VOTE")) {
            let vote = beginVoting('vote');
            if (!vote) { return; }
            if (vote.timeOpen != vote.timeClose) {
                schedule.scheduleJob(vote.timeClose, function () { vote.close(client); });
            }
        }
    }
}
