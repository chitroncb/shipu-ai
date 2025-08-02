module.exports = {
	config: {
		name: "listbox",
		aliases: ["gclist"],
		author: "Chitron Bhattacharjee",
		version: "2.1",
		cooldowns: 5,
		role: 2,
		shortDescription: {
			en: "List all group chats the bot is in."
		},
		longDescription: {
			en: "Use this command to list all group chats the bot is currently in."
		},
		category: "owner",
		guide: {
			en: "{p}{n}"
		}
	},

	onStart: async function ({ api, event }) {
		try {
			const threadList = await api.getThreadList(100, null, ['INBOX']);
			const groupList = threadList.filter(thread => thread.isGroup);

			if (groupList.length === 0) {
				return api.sendMessage("No group chats found.", event.threadID, event.messageID);
			}

			const formattedList = [];

			for (let i = 0; i < groupList.length; i++) {
				const thread = groupList[i];
				let name = "Unnamed Group";
				try {
					const info = await api.getThreadInfo(thread.threadID);
					name = info.threadName || "Unnamed Group";
				} catch (err) {
					console.log(`❌ Couldn't fetch name for TID: ${thread.threadID}`);
				}
				formattedList.push(`│${i + 1}. ${name}\n│𝚃𝙸𝙳: ${thread.threadID}`);
			}

			const message = `╭─────❃\n│𝗟𝗜𝗦𝗧 𝗢𝗙 𝗚𝗥𝗢𝗨𝗣 𝗖𝗛𝗔𝗧𝗦:\n${formattedList.join("\n")}\n╰────────────✦`;
			await api.sendMessage(message, event.threadID, event.messageID);

		} catch (error) {
			console.error("Error listing group chats", error);
			api.sendMessage("❌ An error occurred while fetching group list.", event.threadID, event.messageID);
		}
	}
};