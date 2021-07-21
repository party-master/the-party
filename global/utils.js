const fs = require('fs');
const appRoot = require('app-root-path');

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];  // allows myArray.last()
    };
};

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
    var elem, elem_str;
    var str = "";
    for (i = 0; i < a.length; i++) {
        elem = a[i];
        elem_str = elem.toString();
        if (a.length == 1) { str += elem_str; }
        else if (i != a.length - 1 && a.length == 2) { str += elem_str + " "; }
        else if (i != a.length - 1) { str += elem_str + ", "; }
        else { str += "& " + elem_str; }
    }
    return str;
}

function msToTimecode(ms) {
    const secs = Math.floor((ms / 1000) % 60);
    const mins = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let time_str = "";
    time_str += (days == 0) ? "" : days + "d";
    time_str += (days > 0 && (hours > 0 || mins > 0 || secs > 0)) ? " " : "";
    time_str += (hours == 0) ? "" : hours + "h";
    time_str += (hours > 0 && (mins > 0 || secs > 0)) ? " " : "";
    time_str += (mins == 0) ? "" : mins + "m";
    time_str += (mins > 0 && secs > 0) ? " " : "";
    time_str += (secs == 0) ? "" : secs + "s";
    return time_str;
}

function parseTimeArgs(cmdArgs) {
    let duration = 0;
    const millisecond_amts = {
        secs: 1000,
        mins: 60000,
        hours: 3600000,
        days: 86400000,
        weeks: 604800000,
        months: 2419200000,
        years: 29030400000
    }
    let msg_warn = "";
    const timeunit_names = ['secs', 'mins', 'hours', 'days', 'weeks', 'months', 'years'];
    for (let unit_name of timeunit_names) {
        for (let arg of cmdArgs) {
            if (arg.startsWith(unit_name + '=')) {
                let sliced = arg.slice(unit_name.length + 1, arg.length);
                if (isNaN(sliced)) { msg_warn += "Check " + unit_name + " argument.\n" }  // CHECK
                else if (sliced == "") { msg_warn += "Check " + unit_name + " argument.\n" }  // CHECK
                else { duration += parseInt(sliced) * millisecond_amts[unit_name]; break; }
            }
        }
    }
    return (msg_warn == "") ? duration : msg_warn;
}

function getLines(path) {
    return fs.readFileSync(appRoot + path, 'utf8').toString().split(/\r?\n/);
}

function searchForLine(message, list) {
    list = shuffle(list);
    const msg = message.content.toLowerCase();
    for (i = 0; i < list.length; i++) {
        if (msg.includes(list[i])) { return list[i]; }
    }
    return false;
}

function isComrade(client, member) {
    const guild = client.guilds.resolve(member.guild.id);
    const role_comrade = guild.roles.cache.find(role => role.name === 'Comrades').id;
    if (member.roles.cache.has(role_comrade)) { return true; }
    else { return false; }
}
  
function isTerrorist(client, member) {
    const guild = client.guilds.resolve(member.guild.id);
    const role_terrorist = guild.roles.cache.find(role => role.name === 'Terrorists').id;
    if (member.roles.cache.has(role_terrorist)) { return true; }
    else { return false; }
}

function makeComrade(client, guild_id, user_resolvable) {
    const guild = client.guilds.resolve(guild_id);
    guild.members.fetch(user_resolvable)
        .then(member => {
            const role_comrade = guild.roles.cache.find(role => role.name === 'Comrades').id;
            const role_terrorist = guild.roles.cache.find(role => role.name === 'Terrorists').id;
            member.roles.remove(role_terrorist);
            member.roles.add(role_comrade);
        })
        .catch(console.error);
}

function makeTerrorist(client, guild_id, user_resolvable) {
    const guild = client.guilds.resolve(guild_id);
    guild.members.fetch(user_resolvable)
        .then(member => {
            if (member.id == '716039200864206878') { return; }  // partymaster
            const role_comrade = guild.roles.cache.find(role => role.name === 'Comrades').id;
            const role_terrorist = guild.roles.cache.find(role => role.name === 'Terrorists').id;
            member.roles.remove(role_comrade);
            member.roles.add(role_terrorist);
        })
        .catch(console.error);
}

function checkCreateGuildFiles(guild_id) {
    let path_guild = appRoot.path + '/guilds/' + guild_id;
    if (!fs.existsSync(path_guild)) {
        fs.mkdirSync(path_guild);
    }
    let files = {
        "variables.json": {
            "amounts": {
                "min_votes": 1,
                "default_vote_duration": 120000,
                "min_edu_duration": 120000
            },
            "crimes": [
                "wrongthink",
                "sabotage",
                "terrorism"
            ].sort()
        },
        "courtroom.json": {
            latest_vote: {
                id: 00000,
                status: 'closed'
            },
            open: {},
            closed: {}
        },
        "votes.json": {
            latest_vote: {
                id: 00000,
                status: 'closed'
            },
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

module.exports = {

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

    makeComrade(client, guild_id, user_resolvable) { return makeComrade(client, guild_id, user_resolvable); },

    makeTerrorist(client, guild_id, user_resolvable) { return makeTerrorist(client, guild_id, user_resolvable) },

    checkCreateGuildFiles(guild_id) { return checkCreateGuildFiles(guild_id); }

}
