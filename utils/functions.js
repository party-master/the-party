const Discord = require("discord.js");
const fs = require('fs');

// ch_court = '713990723602743357';  // sandbox
ch_court = '711750664404861059'  // the party

goodthink = shuffle(fs.readFileSync("../global lists/goodthink.txt", 'utf8').split(/\r?\n/));
goodthink_doubleplus = shuffle(fs.readFileSync("../global lists/++goodthink.txt", 'utf8').split(/\r?\n/));
wrongthink = shuffle(fs.readFileSync("../global lists/wrongthink.txt", 'utf8').split(/\r?\n/));
wrongthink_doubleplus = shuffle(fs.readFileSync("../global lists/++wrongthink.txt", 'utf8').split(/\r?\n/));

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

module.exports = {

    getReport(message){
        msg = message.content.toLowerCase();
        report = {
            goodthink: 0,
            goodthink_dp: 0,
            crime: false,
            line: null
        };
        for (i = 0; i < wrongthink_doubleplus.length; i++){
            line = wrongthink_doubleplus[i];
            if (msg.includes(line)){
                report['crime'] = 'terrorism';
                report['line'] = line;
                return report;
            }
        }
        for (i = 0; i < wrongthink.length; i++){
            line = wrongthink[i];
            if (msg.includes(line)){
                report['crime'] = 'wrongthink';
                report['line'] = line;
                return report;
            }
        }
        for (i = 0; i < goodthink.length; i++){
            line = goodthink[i];
            if (msg.includes(line)){
                report['goodthink'] += 1;
                report['line'] = line;
            }
        }
        for (i = 0; i < goodthink_doubleplus.length; i++){
            line = goodthink_doubleplus[i];
            if (msg.includes(line)){
                report['goodthink_dp'] += 1;
                report['line'] = line;
            }
        }
        return report;
    },

    randItem(list){
        return list[Math.floor(Math.random()*list.length)];
    },

    getLines(path){
        return fs.readFileSync("../" + path, 'utf8').toString().split(/\r?\n/);
    },

    shuffle(arr){
        return shuffle(arr);
    },

    randInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
      }

}
