const appRoot = require('app-root-path');
const utils = require(appRoot.path + '/global/utils.js');

const goodthink = utils.getLines("/global/lists/phrases_goodthink.txt");
const wrongthink = utils.getLines("/global/lists/phrases_wrongthink.txt");
const negatives = utils.getLines("/global/lists/phrases_negatives.txt");

class Report {
    constructor() { }
    get(message) {
        this.goodthink = false;
        this.crime = false;
        this.line = false;
        const searches = {
            wrongthink: wrongthink,
            negatives: negatives,
            goodthink: goodthink
        }
        for (let key in searches) {
            this.line = utils.searchForLine(message, searches[key])
            if (!this.line) { continue; }
            switch (key) {
                case 'wrongthink':
                    this.crime = key;
                    return this;
                case 'negatives':
                    this.line = false;
                    return this;
                case 'goodthink':
                    this.goodthink = key;
                    return this;
            }
        }
    }
}

module.exports = {
    get(message) {
        let report = new Report;
        report.get(message);
        return report;
    }
}
