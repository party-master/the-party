const appRoot = require('app-root-path');

module.exports = {
    name: 'checkCreateGuildFiles',
    exec(guild_id) {
        let path_guild = appRoot.path + '/guilds/' + guild_id;
        if (!fs.existsSync(path_guild)) {
            fs.mkdirSync(path_guild);
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
}
