const appRoot = require('app-root-path');

module.exports = {
    name: 'checkCreateGuildFiles',
    execute(guildId) {
        let alreadyExists = true;
        const guildPath = appRoot.path + '/guilds/' + guildId;
        if (!fs.existsSync(guildPath)) {
            fs.mkdirSync(guildPath);
            alreadyExists = false;
        }
        const files = {
            "variables.json": {
                "amounts": {
                    "MIN_VOTES": 1,
                    "DEFAULT_VOTE_DURATION": '120000ms'
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
            },
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
        }
        for (i = 0; i < Object.keys(files).length; i++) {
            let file = Object.keys(files)[i];
            let path = guildPath + "/" + file;
            if (!fs.existsSync(path)) {
                fs.appendFileSync(path, JSON.stringify(files[file], null, 4), function (err) { });
            }
        }
        return alreadyExists;
    }
}
