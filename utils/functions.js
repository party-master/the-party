const fs = require('fs');

var goodthink = getLines("global lists/+goodthink.txt");
var goodthink_doubleplus = getLines("global lists/++goodthink.txt");
var wrongthink = getLines("global lists/+wrongthink.txt");
var wrongthink_doubleplus = getLines("global lists/++wrongthink.txt");
var negatives = getLines("global lists/negatives.txt");

function getLines(path){
    return fs.readFileSync("../" + path, 'utf8').toString().split(/\r?\n/);
}

function randItem(a){
    return a[Math.floor(Math.random() * a.length)];
}

function randInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    list = shuffle(list);
    var msg = message.content.toLowerCase();
    for (i = 0; i < list.length; i++){
        if (msg.includes(list[i])){
            return list[i];
        }
    }
    return false;
}

function getReport(message){
    var line;
    var report = {
        goodthink: false,
        crime: false,
        line: false
    };
    line = searchForLine(message, wrongthink_doubleplus);
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
    line = searchForLine(message, goodthink_doubleplus);
    if (line){
        report['goodthink'] = 'goodthink_doubleplus';
        report['line'] = line;
        return report;
    }
    line = searchForLine(message, goodthink);
    if (line){
        report['goodthink'] = 'goodthink';
        report['line'] = line;
    }
    return report;
}

module.exports = {

    randInteger(min, max){ return randInteger(min, max); },

    randItem(a){ return randItem(a); },

    shuffle(a){ return shuffle(a); },

    getLines(path){ return getLines(path); },

    searchForLine(message, list){ return searchForLine(message, list); },

    getReport(message){ return getReport(message) },

}
