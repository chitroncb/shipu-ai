const leven = require("leven");

// Helper to convert to serif unicode font
function toSerifFont(text) {
	const normal = "abcdefghijklmnopqrstuvwxyz0123456789";
	const serif = "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";
	return text
		.toLowerCase()
		.split("")
		.map(c => {
			const i = normal.indexOf(c);
			return i >= 0 ? serif[i] : c;
		})
		.join("");
}

// Percentage match helper
function similarity(str1, str2) {
	const maxLen = Math.max(str1.length, str2.length);
	const dist = leven(str1, str2);
	return ((maxLen - dist) / maxLen) * 100;
}

module.exports = {
	config: {
		name: "fallback",
		version: "2.1",
		author: "Chitron Bhattacharjee",
		category: "system",
		role: 0
	},

	onChat: async function ({ message, event, api }) {
		const prefix = "+";
		if (!event.body?.startsWith(prefix)) return;

		const args = event.body.slice(prefix.length).trim().split(/\s+/);
		const inputCmd = args[0].toLowerCase();

		const commands = [...global.GoatBot.commands.values()];
		const cmdNames = [];

		for (const cmd of commands) {
			cmdNames.push({ name: cmd.config.name, cmd });
			if (cmd.config.aliases) {
				for (const alias of cmd.config.aliases)
					cmdNames.push({ name: alias, cmd });
			}
		}

		const exactMatch = cmdNames.find(c => c.name === inputCmd);
		if (exactMatch) return;

		const suggestions = cmdNames
			.map(({ name, cmd }) => {
				return {
					name,
					cmd,
					score: similarity(inputCmd, name)
				};
			})
			.filter(s => s.score >= 90)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);

		if (!suggestions.length) return;

		let suggestText = `❌ ${toSerifFont("Command")} "${toSerifFont(inputCmd)}" ${toSerifFont("not found.")}\n`;
		suggestText += `🔍 ${toSerifFont("Did you mean")}:\n\n`;

		const emojiNums = ["➊", "➋", "➌"];
		suggestions.forEach((s, i) => {
			suggestText += `${emojiNums[i]} ${toSerifFont(s.name)}\n`;
		});

		suggestText += `\n💬 ${toSerifFont("Reply with")} 1, 2, or 3 ${toSerifFont("to run one.")}`;

		const suggestMsg = await api.sendMessage(suggestText, event.threadID, event.messageID);

		global.GoatBot.onReply.set(suggestMsg.messageID, {
			type: "fallback-suggest",
			suggestions,
			threadID: event.threadID,
			userID: event.senderID,
			originalInput: inputCmd,
			args: args.slice(1),
			messageID: suggestMsg.messageID
		});
	},

	onReply: async function ({ event, api, Reply, message }) {
		const { type, suggestions, userID, threadID, args, messageID } = Reply;

		if (type !== "fallback-suggest" || event.senderID !== userID) return;

		// Accept normal digits "1","2","3" as reply
		const validReplies = ["1", "2", "3"];
		const index = validReplies.indexOf(event.body.trim());
		if (index === -1 || !suggestions[index]) return;

		const cmd = suggestions[index].cmd;
		const cmdName = cmd?.config?.name || "unknown";

		if (!cmd || typeof cmd.onStart !== "function") {
			await api.sendMessage(`⚠️ ${toSerifFont("Sorry, the command")} "${toSerifFont(cmdName)}" ${toSerifFont("can't be executed like this.")}`, threadID);
			return;
		}

		const newEvent = { ...event };
		newEvent.body = "+" + cmdName + " " + args.join(" ");
		newEvent.senderID = userID;
		newEvent.threadID = threadID;

		const context = {
			api,
			args,
			event: newEvent,
			message,
			usersData: global.usersData,
			threadsData: global.threadsData,
			globalData: global.globalData,
			commandName: cmdName,
			getLang: key => cmd.langs?.en?.[key] || key
		};

		try {
			await cmd.onStart(context);
		} catch (e) {
			console.error("❌ Error running fallback:", e);
			await api.sendMessage("⚠️ An error occurred while running the command.", threadID);
			return;
		}

		try {
			await api.unsendMessage(messageID);
			await api.unsendMessage(event.messageID);
		} catch {}

		await api.sendMessage(`✅ ${toSerifFont("Command")} "${toSerifFont(cmdName)}" ${toSerifFont("executed!")}`, threadID);
	},

	onStart: async function () {
		// Dummy to avoid load error. Real logic runs in onChat/onReply
	}
};