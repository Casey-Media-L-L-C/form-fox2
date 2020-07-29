module.exports = {
	help: ()=> "A little about the bot",
	usage: ()=> [" - Just what's on the tin"],
	execute: async (bot, msg, args) => {
		return ({embed: {
			title: '**About**',
			description: "Eee! I'm Fox! I help people set up forms and responses here on Discord!\nMy prefix is `ff!`",
			fields:[
				{name: "Creators", value: "[greysdawn](https://github.com/greysdawn) | (GS)#6969"},
				{name: "Invite", value: `[Clicky!](${bot.invite})`,inline: true},
				{name: "Support Server", value: "[Clicky!](https://discord.gg/EvDmXGt)", inline: true},
				{name: "Other Links", value: "[Repo](https://github.com/greys-bots/sheep) | [Website](https://sheep.greysdawn.com/)"},
				{name: "Stats", value: `Guilds: ${bot.guilds.cache.size} | Users: ${bot.users.cache.size}`},
				{name: "Support my creators!", value: "[Ko-Fi](https://ko-fi.com/greysdawn) | [Patreon](https://patreon.com/greysdawn)"}
			]
		}})
	},
	alias: ['abt', 'a']
}