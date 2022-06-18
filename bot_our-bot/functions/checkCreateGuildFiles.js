const appRoot = require('app-root-path');

module.exports = {
    name: 'checkCreateGuildFiles',
    exec(guildId) {
        let guildPath = appRoot.path + '/guilds/' + guildId;
        if (!fs.existsSync(guildPath)) {
            fs.mkdirSync(guildPath);
        }
        let files = {
            "variables.json": {
                "amounts": {
                    "min_votes": 1,
                    "default_vote_duration": 120000
                },
                "crimes": [
                    "wrongthink",
                    "sabotage",
                    "terrorism"
                ].sort()
            },
            "courtroom.json": {
                latestVote: {
                    id: 00000,
                    status: 'closed'
                },
                open: {},
                closed: {}
            },
            "votes.json": {
                latestVote: {
                    id: 00000,
                    status: 'closed'
                },
                open: {},
                closed: {}
            }
        }
        for (i = 0; i < Object.keys(files).length; i++) {
            let file = Object.keys(files)[i];
            let path = guildPath + "/" + file;
            if (!fs.existsSync(path)) {
                fs.appendFileSync(path, JSON.stringify(files[file], null, 4), function (err) { });
            }
        }
    }
}
