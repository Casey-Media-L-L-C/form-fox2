const { events: EVENTS, clearBtns } = require(__dirname + '/../../extras');

module.exports = {
	name: 'hook',
	description: 'Commands for handling form hooks',
	type: 2,
	options: []
}

var opts = module.exports.options;

opts.push({
	name: 'view',
	description: "View a form's existing hooks",
	type: 1,
	options: [{
		name: 'form_id',
		description: "The form's ID",
		type: 3,
		required: true
	}],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';

		var hooks = await ctx.client.stores.hooks.getByForm(ctx.guildId, form.hid);
		if(!hooks?.[0]) return "No hooks for that form!";

		return hooks.map(h => {
			return {
				title: `Hook ${h.hid}`,
				description: `Belongs to form ${form.hid}`,
				fields: [
					{name: 'URL', value: h.url},
					{name: 'Events', value: h.events.join(', ')}
				]
			}
		})
	},
	ephemeral: true
})

opts.push({
	name: 'set',
	description: 'Set a hook for a form',
	type: 1,
	options: [
		{
			name: 'form_id',
			description: "The form's ID",
			type: 3,
			required: true
		},
		{
			name: 'url',
			description: "The hook's URL",
			type: 3,
			required: true
		}
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';

		var url = ctx.options.get('url').value;
		if(!ctx.client.utils.checkUrl(url)) return "I need a valid URL!";

		var events = await ctx.client.utils.awaitSelection(ctx, EVENTS.map(e => {
			return {label: e, value: e}
		}), "What events do you want this hook to fire on?", {
			min_values: 1, max_values: EVENTS.length,
			placeholder: 'Select events'
		})
		if(typeof events == 'string') return events;
		
		await ctx.client.stores.hooks.deleteByForm(ctx.guildId, form.hid);
		var hook = await ctx.client.stores.hooks.create(ctx.guildId, form.hid, {
			url,
			events
		});

		return `Hook created! ID: ${hook.hid}`;
	}
})

opts.push({
	name: 'add',
	description: 'Add a hook to a form',
	type: 1,
	options: [
		{
			name: 'form_id',
			description: "The form's ID",
			type: 3,
			required: true
		},
		{
			name: 'url',
			description: "The hook's URL",
			type: 3,
			required: true
		}
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';

		var url = ctx.options.get('url').value;
		if(!ctx.client.utils.checkUrl(url)) return "I need a valid URL!";

		var events = await ctx.client.utils.awaitSelection(ctx, EVENTS.map(e => {
			return {label: e, value: e}
		}), "What events do you want this hook to fire on?", {
			min_values: 1, max_values: EVENTS.length,
			placeholder: 'Select events'
		})
		if(typeof events == 'string') return events;
		
		var hook = await ctx.client.stores.hooks.create(ctx.guildId, form.hid, {
			url,
			events
		});

		return `Hook created! ID: ${hook.hid}`;
	}
})

opts.push({
	name: 'delete',
	description: "Delete an existing hook",
	type: 1,
	options: [
		{
			name: 'form_id',
			description: "The form's ID",
			type: 3,
			required: true
		},
		{
			name: 'hook_id',
			description: "The hook's ID",
			type: 3,
			required: true
		},
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';
		
		var hid = ctx.options.get('hook_id').value.toLowerCase().trim();
		var hook = await ctx.client.stores.hooks.get(ctx.guildId, form.hid, hid);
		if(!hook) return "Hook not found!";

		await ctx.client.stores.hooks.delete(ctx.guildId, form.hid, hook.hid);

		return 'Hook deleted!'
	}
})

opts.push({
	name: 'clear',
	description: "Delete ALL of a form's existing hooks",
	type: 1,
	options: [
		{
			name: 'form_id',
			description: "The form's ID",
			type: 3,
			required: true
		}
	],
	async execute(ctx) {
		var id = ctx.options.get('form_id').value.toLowerCase().trim();
		var form = await ctx.client.stores.forms.get(ctx.guildId, id);;
		if(!form) return 'Form not found!';
		
		var rdata = {
			content: "Are you sure you want to delete ALL hooks on this form?",
			components: [
				{
					type: 1,
					components: clearBtns
				}
			]
		}
		var reply = await ctx.reply({...rdata, fetchReply: true});
		var conf = await ctx.client.utils.getConfirmation(ctx.client, reply, ctx.user);
		var msg;
		if(conf.msg) {
			msg = conf.msg;
		} else {
			await ctx.client.stores.hooks.deleteByForm(ctx.guildId, form.hid);
			msg = 'Hooks cleared!';
		}

		if(conf.interaction) {
			await conf.interaction.update({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: clearBtns.map(b => {
						return {... b, disabled: true};
					})
				}]
			})
		} else {
			await ctx.editReply({
				content: msg,
				embeds: [],
				components: [{
					type: 1,
					components: clearBtns.map(b => {
						return {... b, disabled: true};
					})
				}]
			})
		}
		return;
	}
})