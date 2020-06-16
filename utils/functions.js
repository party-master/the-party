const Discord = require("discord.js");
const fs = require('fs');

var goodthink = shuffle(getLines("global lists/+goodthink.txt"));
var goodthink_doubleplus = shuffle(getLines("global lists/++goodthink.txt"));
var wrongthink = shuffle(getLines("global lists/+wrongthink.txt"));
var wrongthink_doubleplus = shuffle(getLines("global lists/++wrongthink.txt"));
var negatives = shuffle(getLines("global lists/negatives.txt"));

function getLines(path){
    return fs.readFileSync("../" + path, 'utf8').toString().split(/\r?\n/);
}

function randItem(list){
    return list[Math.floor(Math.random()*list.length)];
}

function randInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
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

function searchForLine(message, list){
    var line;
    var msg = message.content.toLowerCase();
    for (i = 0; i < list.length; i++){
        line = list[i];
        if (msg.includes(line)){
            return line;
        }
    }
    return false;
}

function getReport(message){
    var report = {
        goodthink: false,
        crime: false,
        line: null
    };
    var line = searchForLine(message, wrongthink_doubleplus);
    if (line){
        report['crime'] = 'terrorism';
        report['line'] = line;
        return report;
    }
    line = searchForLine(message, wrongthink);
    if (line){
        report['crime'] = 'wrongthink';
        report['line'] = line;
        return report;
    }
    line = searchForLine(message, negatives);
    if (line){
        return report;
    }
    line = searchForLine(message, goodthink);
    if (line){
        report['goodthink'] = true;
        report['line'] = line;
    }
    line = searchForLine(message, goodthink_doubleplus);
    if (line){
        report['goodthink'] = true;
        report['line'] = line;
    }
    return report;
}

module.exports = {

    getReport(message){ return getReport(message) },

    randItem(list){ return randItem(list); },

    getLines(path){ return getLines(path); },

    shuffle(arr){ return shuffle(arr); },

    randInteger(min, max) { return randInteger(min, max); }

}
