module.exports = {
	help: () => 'Create a new form',
	usage: () => [' - Opens a menu to make a new form'],
	desc: ()=> ['Remember: forms can only have up to 20 questions!'],
	execute: async (bot, msg, args) => {
		var data = {};

		var form = await msg.channel.send({embed: {
			title: 'New Form',
			color: parseInt('ee8833', 16)
		}});

		var message = await msg.channel.send("What do you want to name the form?\n(Type `cancel` to cancel!)");
		var resp = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max: 1, time: 60 * 1000})).first();
		if(!resp) return 'Timed out! Aborting!';
		if(resp.content.toLowerCase() == 'cancel') return 'Action cancelled!';
		data.name = resp.content;
		await resp.delete();
		await form.edit({embed: {
			title: resp.content,
			color: parseInt('ee8833', 16)
		}})

		await message.edit("What do you want the form's description to be?\n(Type `cancel` to cancel!)");
		resp = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max: 1, time: 60 * 1000})).first();
		if(!resp) return 'Timed out! Aborting!';
		if(resp.content.toLowerCase() == 'cancel') return 'Action cancelled!';
		data.description = resp.content;
		await resp.delete();
		await form.edit({embed: {
			title: data.name,
			description: resp.content,
			color: parseInt('ee8833', 16)
		}})

		data.questions = [];
		data.required = [];
		var i = 0;
		while(i < 20) {
			await message.edit(`Enter a question! Current question: ${i+1}/20\n(Type \`done\` to finish, or \`cancel\` to cancel!)`);
			resp = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max: 1, time: 2 * 60 * 1000})).first();
			if(!resp) return 'Timed out! Aborting!';
			if(resp.content.toLowerCase() == 'cancel') return 'Action cancelled!';
			if(resp.content.toLowerCase() == 'done') break;
			data.questions.push(resp.content);
			await resp.delete();

			await message.edit(`Would you like this question to be required? (y/n)`);
			resp = (await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max: 1, time: 2 * 60 * 1000})).first();
			if(!resp) return 'Timed out! Aborting!';
			if(['y', 'yes'].includes(resp.content.toLowerCase())) data.required.push(i+1);;
			await resp.delete();

			await form.edit({embed: {
				title: data.name,
				description: resp.content,
				fields: data.questions.map((q, n) => { return {name: `Question ${n+1}${data.required.includes(n+1) ? ' (required)' : ''}`, value: q} }),
				color: parseInt('ee8833', 16)
			}});
		}

		if(data.questions.length == 0) return 'No questions added! Aborting!';

		var code = bot.utils.genCode(bot.chars);
		try {
			await bot.stores.forms.create(msg.guild.id, code, data);
		} catch(e) {
			return 'ERR! '+e;
		}

		return [
			`Form created! ID: ${code}`,
			`Use \`${bot.prefix}channel ${code}\` to change what channel this form's responses go to!`,
			`Use \`${bot.prefix}roles ${code}\` to change what roles are added when this form is accepted!`,	
		].join('\n');
	},
	alias: ['new', 'add', 'n', '+'],
	permissions: ['MANAGE_MESSAGES'],
	guildOnly: true
}