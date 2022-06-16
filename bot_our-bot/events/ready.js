module.exports = {
    name: 'ready',
    once: true,
    exec(client) {
        client.user.setPresence({ activities: [{ type: 'WATCHING', name: 'over us' }] });
	    client.functions.get('checkOpenVotes').exec(client);
        console.log("Our Bot Online");
    }
}