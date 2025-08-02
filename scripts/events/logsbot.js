const { getTime } = global.utils;

module.exports = {
	config: {
		name: "logsbot",
		isBot: true,
		version: "1.4",
		author: "Chitron Bhattacharjee",
		envConfig: {
			allow: true
		},
		category: "events"
	},

	langs: {
		vi: {
			title: "====== Nhật ký bot ======",
			added: "\n✅\nSự kiện: bot được thêm vào nhóm mới\n- Người thêm: %1",
			kicked: "\n❌\nSự kiện: bot bị kick\n- Người kick: %1",
			footer: "\n- User ID: %1\n- Nhóm: %2\n- ID nhóm: %3\n- Thời gian: %4"
		},
		en: {
			title: "𝙱𝚘𝚝 𝙻𝚘𝚐𝚜",
			added: "\n✅\n𝗘𝘃𝗲𝗻𝘁: 𝗯𝗼𝘁 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗮𝗱𝗱𝗲𝗱 𝘁𝗼 𝗮 𝗻𝗲𝘄 𝗴𝗿𝗼𝘂𝗽\n- 𝗔𝗱𝗱𝗲𝗱 𝗯𝘆: %1",
			kicked: "\n❌\n𝗘𝘃𝗲𝗻𝘁: 𝗯𝗼𝘁 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗸𝗶𝗰𝗸𝗲𝗱\n- 𝗞𝗶𝗰𝗸𝗲𝗱 𝗯𝘆: %1",
			footer: "\n- 𝗨𝘀𝗲𝗿 𝗜𝗗: %1\n- 𝗚𝗿𝗼𝘂𝗽: %2\n- 𝗚𝗿𝗼𝘂𝗽 𝗜𝗗: %3\n- 𝗧𝗶𝗺𝗲: %4"
		}
	},

	onStart: async ({ usersData, threadsData, event, api, getLang }) => {
		if (
			(event.logMessageType == "log:subscribe" && event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
			|| (event.logMessageType == "log:unsubscribe" && event.logMessageData.leftParticipantFbId == api.getCurrentUserID())
		) return async function () {
			let msg = getLang("title");
			const { author, threadID } = event;
			if (author == api.getCurrentUserID())
				return;

			let threadName;
			const { config } = global.GoatBot;

			if (event.logMessageType == "log:subscribe") {
				if (!event.logMessageData.addedParticipants.some(item => item.userFbId == api.getCurrentUserID()))
					return;
				threadName = (await api.getThreadInfo(threadID)).threadName;
				const authorName = await usersData.getName(author);
				msg += getLang("added", authorName);
			}
			else if (event.logMessageType == "log:unsubscribe") {
				if (event.logMessageData.leftParticipantFbId != api.getCurrentUserID())
					return;
				const authorName = await usersData.getName(author);
				const threadData = await threadsData.get(threadID);
				threadName = threadData.threadName;
				msg += getLang("kicked", authorName);
			}

			const time = getTime("DD/MM/YYYY HH:mm:ss");
			msg += getLang("footer", author, threadName, threadID, time);

			for (const adminID of config.adminBot)
				api.sendMessage(msg, adminID);
		};
	}
};