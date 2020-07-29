module.exports = {
	help: ()=> "Clears responses",
	usage: ()=> [
		" - Deletes ALL responses across ALL forms",
		" [form id] - Deletes all responses for the given form"
	],
	execute: async (bot, msg, args) => {
		if(args[0]) {
			var form = await bot.stores.forms.get(msg.guild.id, args[0]?.toLowerCase());
			if(!form) return 'Form not found!';

			var message = await msg.channel.send([
				"Are you sure you want to delete ",
				"ALL responses for this form? ",
				"You can't get them back!"
			].join(""));

			['✅','❌'].forEach(r => message.react(r));

			var confirm = await bot.utils.getConfirmation(bot, msg, msg.author);
			if(confirm) return confirm;

			try {
				await bot.stores.responses.deleteByForm(msg.guild.id, form.hid);
				await bot.stores.forms.updateCount(msg.guild.id, form.hid);
			} catch(e) {
				return 'ERR! '+e;
			}
		}

		var message = await msg.channel.send([
			"Are you sure you want to delete ",
			"ALL responses for EVERY form? ",
			"You can't get them back!"
		].join(""));

		['✅','❌'].forEach(r => message.react(r));

		var confirm = await bot.utils.getConfirmation(bot, msg, msg.author);
		if(confirm) return confirm;

		var forms = await bot.stores.forms.getAll(msg.guild.id);
		for(var form of forms) {
			try {
				await bot.stores.responses.deleteByForm(msg.guild.id, form.hid);
				await bot.stores.forms.updateCount(msg.guild.id, form.hid);
			} catch(e) {
				return 'ERR! '+e;
			}
		}

		return 'Responses deleted!';
	}
}