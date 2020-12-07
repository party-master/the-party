const appRoot = require('app-root-path');
const { kMaxLength } = require('buffer');
const path_root = appRoot.path;

const Discord = require(path_root + '/node_modules/discord.js');
const client = new Discord.Client();
const config = require(path_root + '/bot_tester/config.json');
const utils = require(path_root + '/utils/functions.js');
const fs = require('fs');
const schedule = require('node-schedule');

const img_party = 'https://i.imgur.com/GRSG1Em.png';
const CMD_PREFIX = "!"

class Vote {
    constructor() { }
    open(vote_type, message, cmdArgs) {
        checkCreateGuildFiles(message.guild);
        const path_variables = path_root + '/guilds/' + message.guild.id + '/variables.json'
        let variables = utils.getJSON(path_variables);
        let amounts = variables['amounts'];

        let path_suffix;
        switch (vote_type) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'addchannel':
            case 'removechannel':
            case 'renamechannel':
            case 'vote': path_suffix = '/votes.json'; break;
            case 'courtcase': path_suffix = '/courtroom.json'; break;
        }
        const path_votes = path_root + '/guilds/' + message.guild.id + path_suffix;
        const votes = utils.getJSON(path_votes);

        this.details = { desc: "" };
        if (cmdArgs.length != 0) {
            let trigger = false;
            const time_units = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
            for (let arg of cmdArgs) {
                for (let unit of time_units) {
                    if (arg.startsWith(unit)) { trigger = true; break;  }
                }
                if (trigger) { continue; }
                if (arg === cmdArgs[0]) { this.details['desc'] += arg; }
                else { this.details['desc'] += " " + arg; }
            }
        }

        this.vote_id = utils.pad(parseInt(votes['latest_id']) + 1, 5);
        this.vote_type = vote_type
        this.user_id = message.author.id;
        this.guild_id = message.guild.id;
        this.channel_id = message.channel.id;
        this.message_id = message.id;
        this.status = 'Open';
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
            const users = message.mentions.users.array();
            if (users.length == 0) { return; }
            if (users.length > 0) {
                var defendants = new Array();
                var bots = new Array();
                for (i = 0; i < users.length; i++) {
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
        }
        else if (this.vote_type == 'addcrime' || this.vote_type == 'removecrime') {
            /* multi-word crimes
            const time_units = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
            let crime = "";
            let trigger = false;
            for (let cmd of cmdArgs.slice(1, cmdArgs.length)) {
                for (let unit of time_units) {
                    if (cmd.startsWith(unit)) { trigger = true; break; }
                }
                if (trigger) { break; }
                if (crime != "") { crime += " "; }
                crime += cmd.toLowerCase();
            }
            */
            this.details = {
                crime: cmdArgs[1]
            }
        }
        else if ( this.vote_type == 'addchannel' || this.vote_type == 'removechannel' || this.vote_type == 'renamechannel' ) {
            // handle mulit-word args
            this.details = {
                channel_name: cmdArgs[1].toLowerCase()
            }
        }

        votes['latest_id'] = this.vote_id;
        if (this.time_open == this.time_close) {
            votes['closed'][this.vote_id] = this.json();
        }
        else {
            votes['open'][this.vote_id] = this.json();
        }
        utils.setJSON(path_votes, votes);
        message.channel.send(this.embed());
    }
    close() {
        let path_votes;
        switch (this.vote_type) {
            case 'addcrime':
            case 'removecrime':
            case 'variable':
            case 'addchannel':
            case 'removechannel':
            case 'renamechannel':
            case 'vote':
                path_votes = path_root + '/guilds/' + this.guild_id + '/votes.json';
                break;
            case 'courtcase':
                path_votes = path_root + '/guilds/' + this.guild_id + '/courtroom.json';
                break;
        }
        let votes = utils.getJSON(path_votes);
        let guild = client.guilds.resolve(this.guild_id);
        let channel = guild.channels.resolve(this.channel_id);
        let msg_promise = channel.messages.fetch(this.message_id);
        msg_promise.then(msg => {
            let reactions = msg.reactions.cache.array();
            let emojis = reactions.map(reaction => { return reaction.emoji.name; })
            for (let i = 0; i < emojis.length; i++) {
                if (emojis[i] === '👍') {
                    this.votes_up = reactions[i].count - 1;
                    reactions[i].users.remove(client.user);
                }
                else if (emojis[i] === '👎') {
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
                    if (this.votes_down > this.votes_up && this.votes_down >= this.min_votes) {
                        this.passed = true;
                        this.details['verdict'] = 'Guilty';
                        for (let user_id of this.details['defendant_ids']) {
                            makeTerrorist(msg.guild.id, user_id);
                        }
                    }
                    else {
                        this.details['verdict'] = 'Not Guilty';
                    }
                    break;
                case 'variable':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        const path_variables = path_root + '/guilds/' + guild.id + '/variables.json';
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
                        const path_variables = path_root + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(path_variables);
                        let crimes = variables['crimes'];
                        crimes.push(this.details['crime']);
                        variables['crimes'] = crimes;
                        utils.setJSON(path_variables, variables);
                    }
                    break;
                case 'removecrime':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                        const path_variables = path_root + '/guilds/' + guild.id + '/variables.json';
                        const variables = utils.getJSON(path_variables);
                        let crimes = variables['crimes'];
                        crimes = utils.removeItemOnce(crimes, this.details['crime']);
                        variables['crimes'] = crimes;
                        utils.setJSON(path_variables, variables);
                    }
                    break;
                case 'addchannel':
                    if (this.votes_up > this.votes_down && this.votes_up >= this.min_votes) {
                        this.passed = true;
                        guild.channels.create(this.details['channel_name']);
                    }
                    break;
            }
            this.status = 'Closed';
            msg.edit(this.embed());
            this.details['archived'] = true;

            delete votes['open'][this.vote_id];
            votes['closed'][this.vote_id] = this;
            utils.setJSON(path_votes, votes);

        }).catch(error => console.log(error));
    }
    embed() {
        let embed_vote = new Discord.MessageEmbed();
        switch (this.vote_type) {
            case 'vote':
                embed_vote.setTitle("VOTE");
                if (this.status == 'Open') {
                    embed_vote.setDescription(this.details['desc']);  // add conditional?
                    if (this.time_open != this.time_close) {
                        embed_vote.setFooter("Duration: " + this.duration_str);
                    }
                    return embed_vote;
                }
                else if (this.status == 'Closed') {
                    embed_vote.setDescription(this.details['desc'])
                    if (this.time_open != this.time_close) {
                        embed_vote.setFooter(this.passed ? "Vote Passed" : "Vote Failed");
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
                if (this.status == 'Open') {
                    embed_vote.setFooter("Duration: " + this.duration_str);
                    return embed_vote;
                }
                else if (this.status == 'Closed') {
                    if (this.details['reason']) {
                        let footer = this.passed ? "Vote Passed" : "Vote Failed"
                            + "\n" + this.details['reason'];
                        embed_vote.setFooter(footer);
                    }
                    else{
                        embed_vote.setFooter(this.passed ? "Vote Passed" : "Vote Failed");
                    }
                    return embed_vote;
                }
                break;
            case 'courtcase':
                const defendants = this.details['defendant_ids'].map(id => { return client.users.resolve(id); });
                const defendant_usernames = defendants.map(user => { return user.username; });
                embed_vote.setTitle("The Party v. " + defendant_usernames);
                embed_vote.setFooter("Case Number: " + this.vote_id + "\nBrought to you by The Party", img_party);
                embed_vote.addFields(
                    {
                        name: "Plaintiff:",
                        value: client.users.resolve(this.details['plaintiff_id']),
                        inline: true
                    },
                    {
                        name: "Defendants:",
                        value: defendants,
                        inline: true
                    }
                )
                if (this.status == 'Open') {
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
                else if (this.status == 'Closed') {
                    const date_open = new Date(this.time_open);
                    const date_close = new Date(this.time_close);
                    embed_vote.setDescription("Closed");
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
                            value: "NG: " + this.votes_up
                                + ", G: " + this.votes_down
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
                    case 'Open': embed_vote.setFooter("Duration: " + this.duration_str); break;
                    case 'Closed': embed_vote.setFooter(this.passed ? "Vote Passed" : "Vote Failed"); break;
                }
                return embed_vote;
            case 'addchannel':
            case 'removechannel':
                embed_vote.setTitle("VOTE");
                embed_vote.addFields(
                    {
                        name: (this.vote_type == 'addchannel') ? "__Add Channel__" : "__Remove Channel__",
                        value: utils.upper(this.details['channel_name']),
                        inline: false
                    }
                );
                switch (this.status) {
                    case 'Open': embed_vote.setFooter("Duration: " + this.duration_str); break;
                    case 'Closed': embed_vote.setFooter(this.passed ? "Vote Passed" : "Vote Failed"); break;
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
}

function checkCreateGuildFiles(guild_id) {
    let path_guild = path_root + '/guilds/' + guild_id;
    if (!fs.existsSync(path_guild)) {
        fs.mkdirSync(path_guild);
    }
    let files = {
        "variables.json": {
            "amounts": {
                "min_votes": 1,
                "default_vote_duration": 120000,
            },
            "crimes": [
                "wrongthink",
                "sabotage",
                "terrorism"
            ].sort()
        },
        "courtroom.json": {
            latest_id: 00000,
            open: {},
            closed: {}
        },
        "votes.json": {
            latest_id: 00000,
            open: {},
            closed: {}
        }
    }
    for (i = 0; i < Object.keys(files).length; i++) {
        let file = Object.keys(files)[i];
        let path = path_guild + "/" + file;
        if (!fs.existsSync(path)) {
            fs.appendFileSync(path, JSON.stringify(files[file], null, 4), function (err) { });
        }
    }
}

function handleSelfEmbed(message) {
    function beginVoting(vote_type) {
        message.react('👍');
        message.react('👎');

        let path_votes;
        switch (vote_type) {
            case 'vote': path_votes = path_root + '/guilds/' + message.guild.id + '/votes.json'; break;
            case 'courtcase': path_votes = path_root + '/guilds/' + message.guild.id + '/courtroom.json'; break;
        }
        const votes = utils.getJSON(path_votes);
        const vote_data = votes['open'][votes['latest_id']];
        let vote = Object.assign(new Vote(), vote_data);
        vote.message_id = message.id;
        if (vote.status == 'Open') {
            votes['open'][votes['latest_id']]['message_id'] = message.id;
        }
        else {
            votes['closed'][votes['latest_id']]['message_id'] = message.id;
        }
        utils.setJSON(path_votes, votes);
        return vote;
    }
    if (typeof (message.embeds[0]['title']) === 'undefined') { return false; }
    if (message.embeds[0]['title'].startsWith("The Party v.")) {
        let vote = beginVoting('courtcase');
        if (!vote) { return; }
        schedule.scheduleJob(vote.time_close, function () { vote.close(); });
    }
    else if (message.embeds[0]['title'].startsWith("VOTE")) {
        let vote = beginVoting('vote');
        if (!vote) { return; }
        if (vote.time_open != vote.time_close) {
            schedule.scheduleJob(vote.time_close, function () {
                vote.close();
            });
        }
    }
}

client.on('ready', () => {
    console.log("Tester Bot is Online");
    client.user.setPresence({ activity: { type: 'PLAYING', name: 'around' } });
});

client.on('message', async message => {
    if (message.content.startsWith(CMD_PREFIX)) {
        const cmdArgs = message.content.slice(CMD_PREFIX.length).trim().split(' ');
        const cmd = cmdArgs.shift();
        if (message.channel.type != 'dm') {
            switch (cmd) {
                case 'channel':
                    // if (handleUnComrades(message)) { break; }
                    if (cmdArgs[0] == 'add') { new Vote().open('addchannel', message, cmdArgs); break; }
            }
        }
        else {
            switch (cmd) {
                case 'send':
                    // !send <channel_id>
                    if (!isNaN(cmdArgs[0]) && cmdArgs[0].length == 18) {
                        let channel = client.channels.resolve(cmdArgs[0]);
                        if (!channel) return;
                        channel.send(message.content.slice(24));
                    }
                    break;
                case 'edit':
                    // !edit <channel_id> <message_id>
                    if (!isNaN(cmdArgs[0]) && cmdArgs[0].length == 18 && !isNaN(cmdArgs[1]) && cmdArgs[1].length == 18) {
                        let channel = client.channels.resolve(cmdArgs[0]);
                        let msg = channel.messages.fetch(cmdArgs[1]);
                        msg.then(msg => {
                            msg.edit(message.content.slice(45));
                        });                       
                    }
                    break;
            }
        }
    }
    else if (message.embeds.length && message.author.id == client.user.id) {
        handleSelfEmbed(message);
    }
})

client.login(config.token);