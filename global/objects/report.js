const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

const goodthink = utils.getLines("/global/lists/+goodthink.txt");
const goodthink_doubleplus = utils.getLines("/global/lists/++goodthink.txt");
const wrongthink = utils.getLines("/global/lists/+wrongthink.txt");
const wrongthink_doubleplus = utils.getLines("/global/lists/++wrongthink.txt");
const negatives = utils.getLines("/global/lists/negatives.txt");

class Report {
    constructor() { }
    get(message) {
        this.goodthink = false;
        this.crime = false;
        this.line = false;
        const searches = {
            terrorism: wrongthink_doubleplus,
            wrongthink: wrongthink,
            negatives: negatives,
            goodthink_doubleplus: goodthink_doubleplus,
            goodthink: goodthink
        }
        for (let key in searches) {
            this.line = utils.searchForLine(message, searches[key])
            if (!this.line) { continue; }
            switch(key) {
                case 'terrorism':
                    this.crime = key;
                    return report;
                case 'wrongthink':
                    this.crime = key;
                    return report;
                case 'negatives':
                    this.line = false;
                    return report;
                case 'goodthink_doubleplus':
                    this.goodthink = key;
                    return report;
                case 'goodthink':
                    this.goodthink = key;
                    return report;
            }
        }
    }
}

module.exports = {
    get(message) { 
        report = new Report;
        report.get(message);
        return report;
    }
}
