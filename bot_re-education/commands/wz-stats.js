module.exports = {
	name: '!wz-stats',
	description: 'Displays a list of valid re-education commands.',
	execute(message, args) {
        message.channel.send(`Team WZ Stats:
            
            Wins: 53 (11 ^)
            Top 10: 611 (63 ^)
            Games:  2,114 (179 ^)
            WR: 0.025 (13.6% ^)
            Downs: 5,508 (499 ^)
            Kills: 5,508 (574 ^)
            Deaths: 5,507 (455 ^)
            KDR: 1.00 (3.1%  ^)  
            DKR: 1.00 (1% ^) 

            Partiers (Activision)
                @maxxx_swell [Most Top 10],
                @RyanMcElroy [Best DKR], 
                @tommytwohands [Most Kills] + [Best KDR] + [Most Games], 
                @TyBeau [Most Wins], 
                @zola

            Last Update: 08/05/2020 - 08/15/2020
	`)},
};