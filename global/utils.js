const fs = require('fs');
const appRoot = require('app-root-path');
const { EmbedBuilder } = require(appRoot.path + '/node_modules/discord.js');

if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];  // allows myArray.last()
    };
};

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function createComradesRole(guild) {
    return guild.roles.create({
        name: 'Comrades',
        color: '#70c2e9',
    });
}

function createTerroristsRole(guild) {
    return guild.roles.create({
        name: 'Terrorists',
        color: '#ff9f49',
    })
}

function randInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem(a) {
    return a[Math.floor(Math.random() * a.length)];
}

function removeItemOnce(a, value) {
    var index = a.indexOf(value);
    if (index > -1) { a.splice(index, 1); }
    return a;
}

function removeItemAll(a, value) {
    var i = 0;
    while (i < a.length) {
        if (a[i] === value) { a.splice(i, 1); }
        else { ++i; }
    }
    return a;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function getJSON(path) {
    return JSON.parse(fs.readFileSync(path));
}

function setJSON(path, d) {
    jsondata = JSON.stringify(d, null, 4);
    fs.writeFileSync(path, jsondata, function (err) { console.log(err); });
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function lower(word) {
    return word.toLowerCase();
}

function upper(word) {
    return word.substr(0, 1).toUpperCase() + word.substr(1);
}

function arrayToListString(a) {
    var elem, elemStr;
    var str = "";
    for (i = 0; i < a.length; i++) {
        elem = a[i];
        elemStr = elem.toString();
        if (a.length == 1) { str += elemStr; }
        else if (i != a.length - 1 && a.length == 2) { str += elemStr + " "; }
        else if (i != a.length - 1) { str += elemStr + ", "; }
        else { str += "& " + elemStr; }
    }
    return str;
}

function msToTimecode(ms) {
    const secs = Math.floor((ms / 1000) % 60);
    const mins = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let timeStr = "";
    timeStr += (days == 0) ? "" : days + "d";
    timeStr += (days > 0 && (hours > 0 || mins > 0 || secs > 0)) ? " " : "";
    timeStr += (hours == 0) ? "" : hours + "h";
    timeStr += (hours > 0 && (mins > 0 || secs > 0)) ? " " : "";
    timeStr += (mins == 0) ? "" : mins + "m";
    timeStr += (mins > 0 && secs > 0) ? " " : "";
    timeStr += (secs == 0) ? "" : secs + "s";
    return timeStr;
}

function parseTimeArgs(cmdArgs) {
    let duration = 0;
    const millisecondAmts = {
        secs: 1000,
        mins: 60000,
        hours: 3600000,
        days: 86400000,
        weeks: 604800000,
        months: 2419200000,
        years: 29030400000
    }
    let msgWarn = "";
    const timeunitNames = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
    for (let unitName of timeunitNames) {
        for (let arg of cmdArgs) {
            if (arg.startsWith(unitName + '=')) {
                let sliced = arg.slice(unitName.length + 1, arg.length);
                if (isNaN(sliced)) { msgWarn += "Check " + unitName + " argument.\n" }  // CHECK
                else if (sliced == "") { msgWarn += "Check " + unitName + " argument.\n" }  // CHECK
                else { duration += parseInt(sliced) * millisecondAmts[unitName]; break; }
            }
        }
    }
    return (msgWarn == "") ? duration : msgWarn;
}

function getLines(path) {
    return fs.readFileSync(appRoot + path, 'utf8').toString().split(/\r?\n/);
}

function searchForLine(message, list) {
    list = shuffle(list);
    const msg = message.content.toLowerCase();
    for (i = 0; i < list.length; i++) {
        if (msg.replaceAll(" ", "").includes(list[i].replaceAll(" ", ""))) { return list[i]; }
    }
    return false;
}

function isComrade(client, member) {
    const guild = client.guilds.resolve(member.guild.id);
    let roleComrades;
    try { roleComrades = guild.roles.cache.find(role => role.name === 'Comrades').id; }
    catch (error) { roleComrades = createComradesRole(member.guild); roleComrades.then(res => { console.log(res) }); }
    if (member.roles.cache.has(roleComrades)) { return true; }
    else { return false; }
}

function isTerrorist(client, member) {
    const guild = client.guilds.resolve(member.guild.id);
    let roleTerrorists;
    try { roleTerrorists = guild.roles.cache.find(role => role.name === 'Terrorists').id; }
    catch (error) { roleTerrorists = createTerroristsRole(member.guild); roleTerrorists.then(res => { console.log(res) }); }
    if (member.roles.cache.has(roleTerrorists)) { return true; }
    else { return false; }
}

function makeComrade(client, guildId, userResolvable) {
    const guild = client.guilds.resolve(guildId);
    guild.members.fetch(userResolvable)
        .then(async member => {
            const roleComrades = guild.roles.cache.find(role => role.name === 'Comrades').id;
            const roleTerrorists = guild.roles.cache.find(role => role.name === 'Terrorists').id;
            await member.roles.remove(roleTerrorists);
            await member.roles.add(roleComrades);
        })
        .catch(console.error);
}

function makeTerrorist(client, guildId, userResolvable, vote) {
    const guild = client.guilds.resolve(guildId);
    guild.members.fetch(userResolvable)
        .then(async member => {
            if (member.id == '716039200864206878') { return; }  // partymaster
            const roleComrades = guild.roles.cache.find(role => role.name === 'Comrades').id;
            const roleTerrorists = guild.roles.cache.find(role => role.name === 'Terrorists').id;
            await member.roles.remove(roleComrades);
            await member.roles.add(roleTerrorists);
            const channelGulag = member.guild.channels.cache.find(channel => lower(channel.name) === 'gulag');
            if (channelGulag && member.voice.channel) {
                try {
                    await member.voice.setChannel(channelGulag);
                }
                catch {}
            }
            if (vote && vote.voteType == 'courtcase') {
                let variables = getJSON(appRoot.path + '/guilds/' + guildId + '/variables.json');
                let reeducation = guild.channels.cache.find(channel => channel.id === variables.amounts.REEDUCATION_CHANNEL);
                let guiltyMsgEmbed = new EmbedBuilder();
                guiltyMsgEmbed.addFields(
                    {
                        name: "You are a terrorist!",
                        value: (
                            `You\'ve been found guilty of **${lower(vote.details.charge)}** by ${guild.name}.`
                            + (reeducation ? `\nSay \`I love The Party\` in ${reeducation} to become a Comrade.` : '')
                        ),
                        inline: false
                    }
                );
                try { 
                    member.user.send({ embeds: [guiltyMsgEmbed] });
                }
                catch (error) {
                    console.log(`Cannot send messages to ${member.displayName}`);
                }
            }
        })
        .catch(console.error);
}

function checkCreateGuildFiles(client, guildId) {
    const guildPath = appRoot.path + '/guilds/' + guildId;
    const guild = client.guilds.resolve(guildId);
    if (!fs.existsSync(guildPath)) {
        fs.mkdirSync(guildPath);
    }
    let files = {
        "variables.json": {
            "amounts": {
                "MIN_VOTES": "1",
                "DEFAULT_VOTE_DURATION": "5000ms",
                "REEDUCATION_CHANNEL": guild.systemChannelId
            },
            "crimes": [
                "wrongthink",
                "sabotage",
                "terrorism"
            ].sort()
        },
        "courtroom.json": {
            latestVote: {
                id: 0o0000,
                status: 'closed'
            },
            open: {},
            closed: {}
        },
        "votes.json": {
            latestVote: {
                id: 0o0000,
                status: 'closed'
            },
            open: {},
            closed: {}
        },
        "users.json": {},
        "guildConfig.json": {
            roleComrades: {
                name: false,
                id: false
            },
            roleTerrorists: {
                name: false,
                id: false
            },
            roleAdmin: {
                name: false,
                id: false
            }
        },
    };
    for (i = 0; i < Object.keys(files).length; i++) {
        let file = Object.keys(files)[i];
        let path = guildPath + "/" + file;
        if (!fs.existsSync(path)) {
            fs.appendFileSync(path, JSON.stringify(files[file], null, 4), function (err) { });
        }
    }
}

function checkAppendMember(guildId, member) {
    const usersPath = appRoot.path + '/guilds/' + guildId + "/users.json"
    const users = getJSON(usersPath);
    if (!users[member.id]) {
        users[member.id] = {
            id: member.id,
            username: member.user.username,
            globalName: member.user.globalName,
        }
    }
    else {
        users[member.id].username = member.user.username;
        users[member.id].globalName = member.user.globalName;
    }
    setJSON(usersPath, users);
}

function normalizeStr(str) {
    return upper(str.toLowerCase());
}

function makeEmbedColumns(cutoffSingleCol, minCols, maxCols, a, title, embed) {
    let bulletPt = "› ";
    let numColumns = clamp(Math.ceil(a.length / cutoffSingleCol), minCols, maxCols);
    let counter = 0;
    let columns = Array();
    for (let i = 0; i < numColumns; i++) {
        let thisColLength = Math.ceil((a.length - counter) / (numColumns - i));
        let strCol = "";
        for (let j = 0; j < a.length; j++) {
            if (!a[counter]) { break; }
            strCol += "\n" + bulletPt + upper(a[counter]);
            counter += 1;
            if (j + 1 >= thisColLength) {
                columns.push(strCol);
                break;
            }
        }
        embed.addFields(
            {
                name: i == 0 ? title : '‍‍',
                value: strCol,
                inline: true
            },
        );
    }
    return embed;
}

module.exports = {

    clamp(num, min, max) { return clamp(num, min, max); },

    randInteger(min, max) { return randInteger(min, max); },

    randItem(a) { return randItem(a); },

    removeItemOnce(a, value) { return removeItemOnce(a, value); },

    removeItemAll(a, value) { return removeItemAll(a, value); },

    shuffle(a) { return shuffle(a); },

    arrayToListString(a) { return arrayToListString(a); },

    pad(num, size) { return pad(num, size); },

    getJSON(path) { return getJSON(path); },

    setJSON(d, path) { return setJSON(d, path); },

    msToTimecode(duration) { return msToTimecode(duration); },

    dateToSchedStr(date) { return dateToSchedStr(date); },

    lower(word) { return lower(word); },

    upper(word) { return upper(word); },

    parseTimeArgs(cmdArgs) { return parseTimeArgs(cmdArgs); },

    getLines(path) { return getLines(path); },

    searchForLine(message, list) { return searchForLine(message, list); },

    isComrade(client, member) { return isComrade(client, member); },

    isTerrorist(client, member) { return isTerrorist(client, member); },

    makeComrade(client, guildId, userResolvable) { return makeComrade(client, guildId, userResolvable); },

    makeTerrorist(client, guildId, userResolvable, vote) { return makeTerrorist(client, guildId, userResolvable, vote) },

    checkCreateGuildFiles(client, guildId) { return checkCreateGuildFiles(client, guildId); },

    normalizeStr(str) { return normalizeStr(str); },

    makeEmbedColumns(cutoffSingleCol, minCols, maxCols, a, title, embed) {
        return makeEmbedColumns(cutoffSingleCol, minCols, maxCols, a, title, embed);
    },

    checkAppendMember(guildId, member) { return checkAppendMember(guildId, member); }
}
