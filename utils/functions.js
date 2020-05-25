const Discord = require("discord.js");
const fs = require('fs');

ch_court = '713990723602743357';  // sandbox
// ch_court = '711750664404861059'  // the party

wrongthink = fs.readFileSync("../global lists/wrongthink.txt", 'utf8').split(/\r?\n/);
wrongthink_doubleplus = fs.readFileSync("../global lists/++wrongthink.txt", 'utf8').split(/\r?\n/);

module.exports = {

    catchWrongthink(message){
        msg = message.content.toLowerCase();
        report = {
            crime: false,
            line: null
        };
        for (i = 0; i < wrongthink.length; i++){
            line = wrongthink[i];
            if (msg.includes(line)){
                report = {
                    crime: 'wrongthink',
                    line: line
                };
            }
        }
        for (i = 0; i < wrongthink_doubleplus.length; i++){
            line = wrongthink_doubleplus[i];
            if (msg.includes(line)){
                report = {
                    crime: 'terrorism',
                    line: line
                };
            }
        }
        return report;
    },

    randItem(list){
        return list[Math.floor(Math.random()*list.length)];
    },

    getLines(path){
        return fs.readFileSync("../" + path, 'utf8').toString().split(/\r?\n/);
    }

}
