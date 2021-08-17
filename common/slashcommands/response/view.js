module.exports = {
	data: {
		name: 'view',
		description: "View received responses",
		options: [
			{
				name: 'response_id',
				description: "The response's ID",
				type: 3,
				required: false
			},
			{
				name: 'form_id',
				description: "The form's ID",
				type: 3,
				required: false
			},
			{
				name: 'status_filter',
				description: "The status to filter by",
				type: 3,
				required: false,
				choices: [
					{ name: 'accepted', value: 'accepted' },
					{ name: 'denied', value: 'denied' },
					{ name: 'pending', value: 'pending' }
				]
			},
			{
				name: 'from',
				description: "The user to filter by",
				type: 6,
				required: false
			}
		]
	},
	usage: [
		"- View all responses received",
		"[response_id] - View a specific response",
		"[form_id] - View responses from a specific form",
		"[status_filter] - View responses with a specific status",
		"[from] - View responses from a given user",
		"(combination of form\_id, status\_filter, and/or from) - Filter responses further"
	],
	async execute(ctx) {
		var fid = ctx.options.getString('form_id', false)?.toLowerCase().trim();
		var rid = ctx.options.getString('response_id', false)?.toLowerCase().trim();
		var status = ctx.options.getString('status_filter', false);
		var fu = ctx.options.getUser('from', false);

		var responses = await ctx.client.stores.responses.getAll(ctx.guildId);
		if(!responses?.[0]) return "No responses received!";

		if(rid) {
			responses = responses.filter(r => r.hid == rid)
		} else {
			if(fid) responses = responses.filter(r => r.form.hid == fid);
			if(status) responses = responses.filter(r => r.status == status);
			if(fu) responses = responses.filter(r => r.user_id == fu.id);
		}
		if(!responses[0]) return "No responses matching that filter!";

		var embeds = [];
		for(var r of responses) {
			var qs = r.questions?.[0] ? r.questions : r.form.questions;
			var color;
			switch(r.status) {
				case 'accepted':
					color = parseInt('55aa55', 16);
					break;
				case 'denied':
					color = parseInt('aa5555', 16);
					break;
				default:
					color = parseInt('ccaa55', 16)
			}

			embeds.push({
				title: `Response ${r.hid}`,
				description:
					`Form name: ${r.form.name}\n` +
					`Form ID: ${r.form.hid}\n` +
					`User: <@${r.user_id}>`,
				fields: qs.map((q, i) => {
					return {
						name: q.value,
						value: r.answers[i] ?? "*(answer skipped)*"
					}
				}),
				color,
				footer: {text: `Response status: ${r.status}`},
				timestamp: new Date(r.received).toISOString()
			})
		}

		if(embeds.length > 1)
			for(var i = 0; i < embeds.length; i++)
				embeds[i].title += ` (${i +1}/${embeds.length})`;

		return embeds;
	},
	ephemeral: true
}