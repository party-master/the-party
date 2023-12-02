module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        client.functions.get('checkOpenVotes').execute(client);

        let guildIds = [
            '711747538033573929',
            '712184607860326400',
        ];

        // delete application commands
        // client.application.commands.set([]);

        // delete guild commands
        if (false) {
            for (let guildId of guildIds) {
                let guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    console.log(`Error - Our Bot, ready.js: Not in guild with id ${guildId}`);
                    continue;
                }
                guild.commands.set([]);
            }
            console.log("Our Bot: Commands deleted.");
            return;
        }
        
        for (let guildId of guildIds) {
            let guild = client.guilds.cache.get(guildId);
            if (!guild) {
                // console.log(`Error - ready.js: Not in guild with id ${guildId}`);
                continue;
            }
            
            for (let command of client.commands) {
                command = command[1];
                guild.commands.create({
                    name: command.data.name,
                    description: command.data.description,
                    options: command.data.options || []
                });
            }
        }
        
        client.user.setActivity({ type: 'WATCHING', name: 'over us' });
        setInterval(() => {
            client.user.setActivity({ type: 'WATCHING', name: 'over us' });
        }, 900000);
        console.log("Our Bot Online");
    }
}