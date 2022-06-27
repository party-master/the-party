module.exports = {
    name: 'messageCreate',
    once: false,
    execute(message) {
        if (message.channel.type == 'dm'){ return; }
        try { client.functions.get('respond').execute(message); }
        catch (error) { console.log(error); }
    }
}