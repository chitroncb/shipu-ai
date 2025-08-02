module.exports = {
	config: {
		name: "check",
		aliases: ["chk"],
		version: "1.3",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Bot health check"
		},
		description: {
			en: "Tests whether the bot can send messages here."
		},
		category: "system",
		guide: {
			en: "Use +check / +chk or simply type check / chk"
		}
	},

	// Prefix trigger
	onStart: async function ({ api, message, event }) {
		await runHealthCheck({ api, message, event });
	},

	// No-prefix trigger
	onChat: async function ({ event, api, message }) {
		const body = (event.body || "").trim().toLowerCase();
		if (body === "check" || body === "chk") {
			await runHealthCheck({ api, message, event });
		}
	}
};

// Main health check routine
async function runHealthCheck({ api, message, event }) {
	const RUN  = "✅";   // test running
	const OK   = "✅";   // success
	const FAIL = "⚠️";   // failed

	// Indicate that bot is processing
	try {
		await api.setMessageReaction(RUN, event.messageID, () => {}, true);
	} catch {}

	let canSend = true;

	// Try replying
	try {
		const banner =
			"╔═ BOT OK ═╗\n" +
			"╚═══════════╝";
		await message.reply(banner);
	} catch (e) {
		canSend = false;
	}

	// Update reaction based on result
	try {
		await api.setMessageReaction("", event.messageID, () => {}, true);  
		await api.setMessageReaction(canSend ? OK : FAIL, event.messageID, () => {}, true);
	} catch {}
}