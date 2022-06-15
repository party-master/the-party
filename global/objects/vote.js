const appRoot = require('app-root-path');
const { Discord, MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const utils = require(appRoot.path + '/global/utils.js');
const globals = require(appRoot.path + '/global/globals.js');
const schedule = require('node-schedule');

class Vote {
    constructor() { }
    open(client, vote_type, message, cmdArgs) {
        const path_variables = appRoot.path + '/guilds/' + message.guild.id + '/variables.json'
        let variables = utils.getJSON(path_variables);
        let amounts = variables['amounts'];

        let path_suffix;
        switch (vote_type) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'vote': path_suffix = '/votes.json'; break;
            case 'courtcase': path_suffix = '/courtroom.json'; break;
        }
        const path_votes = appRoot.path + '/guilds/' + message.guild.id + path_suffix;
        const votes = utils.getJSON(path_votes);

        this.details = { desc: "" };
        if (cmdArgs.length != 0) {
            let trigger = false;
            const time_units = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
            for (let arg of cmdArgs) {
                for (let unit of time_units) {
                    if (arg.startsWith(unit + "=")) { trigger = true; break; }
                }
                if (trigger) { continue; }
                if (arg === cmdArgs[0]) { this.details['desc'] += arg; }
                else { this.details['desc'] += " " + arg; }
            }
        }
        this.vote_id = utils.pad(parseInt(votes['latest_vote']['id']) + 1, 5);
        this.vote_type = vote_type
        this.user_id = message.author.id;
        this.guild_id = message.guild.id;
        this.channel_id = message.channel.id;
        this.message_id = message.id;
        this.status = 'open';
        this.passed = false;
        this.votes_up = 0;
        this.votes_down = 0;
        this.min_votes = amounts['min_votes'];

        let duration = utils.parseTimeArgs(cmdArgs);
        if (isNaN(duration)) { message.channel.send(duration); return; }
        this.time_open = new Date().getTime();
        if (duration == 0 && vote_type != 'vote') {
            duration = parseInt(amounts['default_vote_duration']);
            this.time_close = this.time_open + duration;
        }
        this.time_close = this.time_open + duration;
        this.duration_str = utils.msToTimecode(duration);

        if (this.vote_type == 'courtcase') {
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
                const defendant_ids = defendants.map(user => { return user.id; });
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
                        plaintiff_id: message.member.id,
                        defendant_ids: defendant_ids,
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
        else if (this.vote_type == 'variable') {
            this.details = {
                variable: cmdArgs[0],
                value: cmdArgs[1],
                og_value: amounts[cmdArgs[0]],
                reason: false
            }
            if (cmdArgs[0] == 'default_vote_duration') {
                this.details.og_value += " (ms)"
            }
            else if (cmdArgs[0] == 'min_edu_duration') {
                this.details.og_value += " (ms)"
            }
        }
        else if (this.vote_type == 'addcrime' || this.vote_type == 'removecrime') {
            this.details = {
                crime: cmdArgs[1]
            }
        }

        votes['latest_vote']['id'] = this.vote_id;
        if (this.time_open == this.time_close) {
            this.status = 'closed';
            votes['closed'][this.vote_id] = this.json();
            votes['latest_vote']['status'] = 'closed';
        }
        else {
            this.status = 'open';
            votes['open'][this.vote_id] = this.json();
            votes['latest_vote']['status'] = 'open';
        }
        utils.setJSON(path_votes, votes);
        message.channel.send({ embeds: [this.embed(client)] });
    }
    close(client) {
        let path_votes;
        switch (this.vote_type) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'vote':
                path_votes = appRoot.path + '/guilds/' + this.guild_id + '/votes.json';
                break;
            case 'courtcase':
                path_votes = appRoot.path + '/guilds/' + this.guild_id + '/courtroom.json';
                break;
        }
        let votes = utils.getJSON(path_votes);
        let guild = client.guilds.resolve(this.guild_id);
        let channel = guild.channels.resolve(this.channel_id);
        let msg_promise = channel.messages.fetch(this.message_id);
        msg_promise.then(msg => {
            let reactions = Array.from(msg.reactions.cache.values());
            let emojis = reactions.map(reaction => { return reaction.emoji.name; })
            for (let i = 0; i < emojis.length; i++) {
                if (emojis[i] == '👍') {
                    this.votes_up = reactions[i].count - 1;
                    reactions[i].users.remove(client.user);
                }
                else if (emojis[i] == '👎') {
                    this.votes_down = reactions[i].count - 1;
                    reactions[i].users.remove(client.user);
                }
            }
            switch (this.vote_type) {
                case 'vote':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                    }
                    break;
                case 'courtcase':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                        this.details['verdict'] = 'Guilty';
                        for (let user_id of this.details['defendant_ids']) {
                            utils.makeTerrorist(client, msg.guild.id, user_id);
                        }
                    }
                    else {
                        this.details['verdict'] = 'Not Guilty';
                    }
                    break;
                case 'variable':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        const path_variables = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(path_variables);
                        const amounts = variables['amounts'];
                        if (this.details['variable'] == 'min_votes' && this.votes_up + this.votes_down < this.details['value']) {
                            this.details['reason'] = "The total number of votes must amount to the new value."
                            break;
                        }
                        this.passed = true;
                        amounts[this.details['variable']] = this.details['value'];
                        utils.setJSON(path_variables, variables);
                    }
                    break;
                case 'addcrime':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                        const path_variables = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(path_variables);
                        let crimes = variables['crimes'];
                        crimes.push(this.details['crime'].toLowerCase());
                        variables['crimes'] = crimes;
                        utils.setJSON(path_variables, variables);
                    }
                    break;
                case 'removecrime':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                        const path_variables = appRoot.path + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(path_variables);
                        let crimes = variables['crimes'];
                        crimes = utils.removeItemOnce(crimes, this.details['crime'].toLowerCase());
                        variables['crimes'] = crimes;
                        utils.setJSON(path_variables, variables);
                    }
                    break;
            }
            this.status = 'closed';
            msg.edit({embeds: [this.embed(client)] });
            this.details['archived'] = true;

            delete votes['open'][this.vote_id];
            votes['closed'][this.vote_id] = this;
            utils.setJSON(path_votes, votes);

        }).catch(error => console.log(error));
    }
    embed(client) {
        let embed_vote = new MessageEmbed();
        switch (this.vote_type) {
            case 'vote':
                embed_vote.setTitle("VOTE");
                if (this.status == 'open') {
                    embed_vote.setDescription(this.details['desc']);  // add conditional?
                    if (this.time_open != this.time_close) {
                        embed_vote.setFooter({ text: "Duration: " + this.duration_str });
                    }
                    return embed_vote;
                }
                else if (this.status == 'closed') {
                    embed_vote.setDescription(this.details['desc'])
                    if (this.time_open != this.time_close) {
                        embed_vote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" });
                    }
                    return embed_vote;
                }
                break;
            case 'variable':
                embed_vote.setTitle("VOTE");
                embed_vote.addFields(
                    {
                        name: "__Set Variable__",
                        value: this.details['variable']
                            + "\nFrom: " + this.details['og_value']
                            + "\nTo: " + this.details['value'],
                        inline: false
                    }
                );
                if (this.status == 'open') {
                    embed_vote.setFooter({ text: "Duration: " + this.duration_str });
                    return embed_vote;
                }
                else if (this.status == 'closed') {
                    if (this.details['reason']) {
                        let footer = {
                            text: this.passed ? "Vote Passed" : "Vote Failed"
                                + "\n" + this.details['reason']
                        };
                        embed_vote.setFooter(footer);
                    }
                    else {
                        embed_vote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" });
                    }
                    return embed_vote;
                }
                break;
            case 'courtcase':
                const defendants = this.details['defendant_ids'].map(id => { return client.users.resolve(id); });
                const defendant_usernames = defendants.map(user => { return user.username; });
                embed_vote.setTitle("The Party v. " + defendant_usernames);
                embed_vote.setFooter({ text: "Case Number: " + this.vote_id + "\nBrought to you by The Party", iconURL: globals.img_party });
                embed_vote.addFields(
                    {
                        name: "Plaintiff:",
                        // value: client.users.resolve(this.details['plaintiff_id']),
                        // value: this.details['plaintiff_id'],
                        value: client.users.resolve(this.details['plaintiff_id']).toString(),
                        inline: true
                    },
                    {
                        name: "Defendants:",
                        value: defendants.join("\n"),
                        inline: true
                    }
                )
                
                if (this.status == 'open') {
                    
                    embed_vote.addFields(
                        {
                            name: "Charge:",
                            value: this.details['charge'] + "\n"
                                + "\nTrial Duration: " + this.duration_str
                                + "\nMin Votes Guilty: " + this.min_votes,
                            inline: false
                        }
                    );
                    
                }
                else if (this.status == 'closed') {
                    const date_open = new Date(this.time_open);
                    const date_close = new Date(this.time_close);
                    embed_vote.setDescription("closed");
                    embed_vote.addFields(
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
                            value: "NG: " + this.votes_down
                                + ", G: " + this.votes_up
                                + " (Min Needed: " + this.min_votes + ")"
                                + "\n"
                                + "\nOpen: " + date_open.toLocaleDateString() + " " + date_open.toLocaleTimeString()
                                + "\nClose: " + date_close.toLocaleDateString() + " " + date_close.toLocaleTimeString(),
                            inline: false
                        }
                    );
                    if (this.details['verdict'] == "Guilty") { embed_vote.setColor("#ff9f49") }
                    else { embed_vote.setColor("#70c2e9") }
                }
                return embed_vote;
            case 'addcrime':
            case 'removecrime':
                embed_vote.setTitle("VOTE");
                embed_vote.addFields(
                    {
                        name: (this.vote_type == 'addcrime') ? "__Add Crime__" : "__Remove Crime__",
                        value: utils.upper(this.details['crime']),
                        inline: false
                    }
                );
                switch (this.status) {
                    case 'open': embed_vote.setFooter({ text: "Duration: " + this.duration_str }); break;
                    case 'closed': embed_vote.setFooter({ text: this.passed ? "Vote Passed" : "Vote Failed" }); break;
                }
                return embed_vote;
        }
    }
    json() {
        return {
            vote_type: this.vote_type,
            vote_id: this.vote_id,
            user_id: this.user_id,
            guild_id: this.guild_id,
            channel_id: this.channel_id,
            message_id: this.message_id,
            status: this.status,
            passed: this.passed,
            votes_up: this.votes_up,
            votes_down: this.votes_down,
            min_votes: this.min_votes,
            duration_str: this.duration_str,
            time_open: this.time_open,
            time_close: this.time_close,
            details: this.details
        };
    }
    assign(vote_data){
        let jsonkeys = this.json();
        for (let key in jsonkeys) { this[key] = vote_data[key]; }
    }
}

module.exports = {
    new() {
        let vote = new Vote;
        return vote;
    },
    open(client, vote_type, message, cmdArgs) { 
        let vote = new Vote;
        vote.open(client, vote_type, message, cmdArgs);
        return vote;
    },
    handleSelfEmbed(client, message) {
        if (!message.embeds.length || message.author.id != client.user.id) { return; }
        function beginVoting(vote_type) {
            message.react('👍');
            message.react('👎');
    
            let path_votes;
            switch (vote_type) {
                case 'vote': path_votes = appRoot.path + '/guilds/' + message.guild.id + '/votes.json'; break;
                case 'courtcase': path_votes = appRoot.path + '/guilds/' + message.guild.id + '/courtroom.json'; break;
            }
            let votes = utils.getJSON(path_votes);
            let latest_status = votes['latest_vote']['status'];
            let latest_id = votes['latest_vote']['id'];
            let vote_data = votes[latest_status][latest_id];
            let vote = new Vote;
            vote.assign(vote_data);
            vote.message_id = message.id;
            if (vote.status == 'open') { votes['open'][votes['latest_vote']['id']]['message_id'] = message.id; }
            else { votes['closed'][votes['latest_vote']['id']]['message_id'] = message.id; }
            utils.setJSON(path_votes, votes);
            return vote;
        }
        if (typeof (message.embeds[0]['title']) == 'undefined') { return false; }
        if (message.embeds[0]['title'].startsWith("The Party v.")) {
            let vote = beginVoting('courtcase');
            if (!vote) { return; }
            schedule.scheduleJob(vote.time_close, function () { vote.close(client); });
        }
        else if (message.embeds[0]['title'].startsWith("VOTE")) {
            let vote = beginVoting('vote');
            if (!vote) { return; }
            if (vote.time_open != vote.time_close) {
                schedule.scheduleJob(vote.time_close, function () { vote.close(client); });
            }
        }
    }
}
