const {Collection} = require("discord.js");

class FormStore extends Collection {
	constructor(bot, db) {
		super();

		this.db = db;
		this.bot = bot;
	};

	async create(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO forms (
					server_id,
					hid,
					name,
					description,
					questions,
					channel_id,
					roles,
					open
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
				[server, hid, data.name, data.description,
				 JSON.stringify(data.questions || []),
				 data.channel_id, data.roles || [], data.open || true]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res(await this.get(server, hid));
		})
	}

	async index(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`INSERT INTO forms (
					server_id,
					hid,
					name,
					description,
					questions,
					channel_id,
					roles,
					open
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
				[server, hid, data.name, data.description,
				 data.questions || [],
				 data.channel_id, data.roles || [], data.open || true]);
			} catch(e) {
				console.log(e);
		 		return rej(e.message);
			}
			
			res();
		})
	}

	async get(server, hid, forceUpdate = false) {
		return new Promise(async (res, rej) => {
			if(!forceUpdate) {
				var form = super.get(`${server}-${hid}`);
				if(form) return res(form);
			}
			
			try {
				var data = await this.db.query(`SELECT * FROM forms WHERE server_id = $1 AND hid = $2`,[server, hid]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				this.set(`${server}-${hid}`, data.rows[0])
				res(data.rows[0])
			} else res(undefined);
		})
	}

	async getAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var data = await this.db.query(`SELECT * FROM forms WHERE server_id = $1`,[server]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			if(data.rows && data.rows[0]) {
				res(data.rows)
			} else res(undefined);
		})
	}

	async update(server, hid, data = {}) {
		return new Promise(async (res, rej) => {
			if(data.questions) data.questions = JSON.stringify(data.questions);
			try {
				await this.db.query(`UPDATE forms SET ${Object.keys(data).map((k, i) => k+"=$"+(i+3)).join(",")} WHERE server_id = $1 AND hid = $2`,[server, hid, ...Object.values(data)]);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}

			var form = await this.get(server, hid, true);
			if(!form) return res(undefined); //that's just silly
			var responses = await this.bot.stores.responses.getByForm(server, hid);

			var errs = [];
			if(['name', 'description', 'open', 'color'].find(x => Object.keys(data).includes(x))) {
				var posts = await this.bot.stores.formPosts.getByForm(server, hid);
				var guild = this.bot.guilds.resolve(server);
				if(posts) {
					for(var post of posts) {
						try {
							var chan = guild.channels.resolve(post.channel_id);
							var msg = await chan.messages.fetch(post.message_id);
							if(!msg) {
								await this.bot.stores.formPosts.delete(server, post.channel_id, post.message_id);
								return rej('Message missing!');
							}

							await msg.edit({embed: {
								title: form.name,
								description: form.description,
								color: parseInt(!form.open ? 'aa5555' : form.color || '55aa55', 16),
								fields: [{name: 'Response Count', value: responses?.length || 0}],
								footer: {
									text: !form.open ?
									'this form is not accepting responses right now!' :
									'react below to apply to this form!'
								}
							}})
						} catch(e) {
							errs.push(`Channel: ${chan.name} (${chan.id})\nErr: ${e.message || e}`);
						}
					}
				}
			}

			if(errs.length > 0) rej(errs);
			else res(form);
		})
	}

	async updateCount(server, hid) {
		return new Promise(async (res, rej) => {
			var form = await this.get(server, hid);
			if(!form) return res(undefined); //that's just silly

			var errs = [];
			var responses = await this.bot.stores.responses.getByForm(server, hid);
			var posts = await this.bot.stores.formPosts.getByForm(server, hid);
			var guild = this.bot.guilds.resolve(server);
			if(posts) {
				for(var post of posts) {
					try {
						var chan = guild.channels.resolve(post.channel_id);
						var msg = await chan.messages.fetch(post.message_id);
						if(!msg) {
							await this.bot.stores.formPosts.delete(server, post.channel_id, post.message_id);
							return rej('Message missing!');
						}

						await msg.edit({embed: {
							title: form.name,
							description: form.description,
							color: parseInt(!form.open ? 'aa5555' : form.color || '55aa55', 16),
							fields: [{name: 'Response Count', value: responses?.length || 0}],
							footer: {
								text: !form.open ?
								'this form is not accepting responses right now!' :
								'react below to apply to this form!'
							}
						}})
					} catch(e) {
						errs.push(`Channel: ${chan.name} (${chan.id})\nErr: ${e.message || e}`);
					}
				}
			}

			if(errs.length > 0) rej(errs);
			else res(await this.get(server, hid, true));
		})
	}

	async delete(server, hid) {
		return new Promise(async (res, rej) => {
			try {
				await this.db.query(`DELETE FROM forms WHERE server_id = $1 AND hid = $2`, [server, hid]);
				await this.bot.stores.formPosts.deleteByForm(server, hid);
				await this.bot.stores.openResponses.deleteByForm(server, hid);
				await this.bot.stores.responses.deleteByForm(server, hid);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			super.delete(`${server}-${hid}`);
			res();
		})
	}

	async deleteAll(server) {
		return new Promise(async (res, rej) => {
			try {
				var forms = await this.getAll(server);
				if(!forms?.[0]) return res();
				for(var form of forms) await this.delete(server, form.hid);
			} catch(e) {
				console.log(e);
				return rej(e.message);
			}
			
			res();
		})
	}
}

module.exports = (bot, db) => new FormStore(bot, db);