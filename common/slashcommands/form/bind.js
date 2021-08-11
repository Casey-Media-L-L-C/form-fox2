module.exports = {
	name: 'bind',
	description: "Bind a form's apply react to a message",
	options: [
		{
			name: 'form_id',
			description: "The form's ID",
			type: 3,
			required: true
		},
		{
			name: 'msg_id',
			description: "The message to bind to",
			type: 3,
			required: true
		},
		{
			name: 'channel',
			description: "The channel the message belongs to. Defaults to the command channel",
			type: 7,
			required: false
		}
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';

		var channel;
		var ch = ctx.options.getChannel('channel');
		if(ch && ['GUILD_TEXT', 'GUILD_NEWS'].includes(ch.type)) channel = ch;
		else channel = ctx.channel;

		var mid = ctx.options.get('msg_id').value.trim();
		var msg;
		try {
			msg = await channel.messages.fetch(mid);
		} catch(e) {
			return 'Message not found!';
		}

		var post = await ctx.client.stores.formPosts.get(ctx.guildId, channel.id, msg.id);
		if(post && !post.bound) return 'That is a dedicated post and cannot be bound to!';

		post = (await ctx.client.stores.formPosts.getByMessage(ctx.guildId, msg.id))
			?.find(p => p.form.emoji == form.emoji);
		if(post) return 'Form with that emoji already bound to that message!';

		msg.react(form.emoji || '📝');
		await ctx.client.stores.formPosts.create(ctx.guildId, channel.id, msg.id, {
			form: form.hid,
			bound: true
		});

		return 'Bound!'
	},
	epphemeral: true
}