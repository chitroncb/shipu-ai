const { getTime } = global.utils;

module.exports = {
  config: {
    name: "fan",
    version: "2.1",
    author: "𝓒𝓱𝓲𝓽𝓻𝓸𝓷 𝓑𝓱𝓪𝓽𝓽𝓪𝓬𝓱𝓪𝓻𝓳𝓮𝓮 🐐✨",
    countDown: 5,
    role: 2,
    description: {
      en: "𝙿𝚘𝚠𝚎𝚛𝚏𝚞𝚕𝚕𝚢 𝚖𝚊𝚗𝚊𝚐𝚎 𝚞𝚜𝚎𝚛𝚜: 𝚜𝚎𝚊𝚛𝚌𝚑, 𝚋𝚊𝚗, 𝚊𝚗𝚍 𝚞𝚗𝚋𝚊𝚗 𝚠𝚒𝚝𝚑 𝚊𝚞𝚝𝚑𝚘𝚛𝚒𝚝𝚢"
    },
    category: "owner",
    guide: {
      en:
        "{pn} [find | -f | search | -s] <keyword> - 𝙵𝚒𝚗𝚍 𝚞𝚜𝚎𝚛𝚜 𝚋𝚢 𝚗𝚊𝚖𝚎\n" +
        "{pn} [ban | -b] [@tag | reply | uid] <reason> - 𝙱𝚊𝚗 𝚞𝚜𝚎𝚛 𝚏𝚛𝚘𝚖 𝚞𝚜𝚒𝚗𝚐 𝚝𝚑𝚎 𝚋𝚘𝚝\n" +
        "{pn} [unban | -u] [@tag | reply | uid] - 𝚁𝚎𝚖𝚘𝚟𝚎 𝚋𝚊𝚗 𝚏𝚛𝚘𝚖 𝚊 𝚞𝚜𝚎𝚛"
    }
  },

  langs: {
    en: {
      noUserFound: "❌ 𝙽𝚘 𝚞𝚜𝚎𝚛 𝚖𝚊𝚝𝚌𝚑𝚎𝚜 𝚝𝚑𝚎 𝚔𝚎𝚢𝚠𝚘𝚛𝚍: \"%1\"",
      userFound: "🔍 %1 𝚞𝚜𝚎𝚛(𝚜) 𝚖𝚊𝚝𝚌𝚑𝚎𝚍 \"%2\":\n%3",
      uidRequired: "❌ 𝚄𝚜𝚎𝚛 𝙸𝙳 𝚒𝚜 𝚛𝚎𝚚𝚞𝚒𝚛𝚎𝚍. 𝚄𝚜𝚎: 𝚏𝚊𝚗 𝚋𝚊𝚗 <𝚞𝚒𝚍> <𝚛𝚎𝚊𝚜𝚘𝚗>",
      reasonRequired: "❌ 𝚁𝚎𝚊𝚜𝚘𝚗 𝚒𝚜 𝚖𝚊𝚗𝚍𝚊𝚝𝚘𝚛𝚢 𝚝𝚘 𝚋𝚊𝚗 𝚊 𝚞𝚜𝚎𝚛. 𝚄𝚜𝚎: 𝚏𝚊𝚗 𝚋𝚊𝚗 <𝚞𝚒𝚍> <𝚛𝚎𝚊𝚜𝚘𝚗>",
      userHasBanned: "⚠️ 𝚄𝚜𝚎𝚛 [%1 | %2] 𝚒𝚜 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚋𝚊𝚗𝚗𝚎𝚍:\n• 𝚁𝚎𝚊𝚜𝚘𝚗: %3\n• 𝚃𝚒𝚖𝚎: %4",
      userBanned: "✅ 𝚄𝚜𝚎𝚛 [%1 | %2] 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 **𝙱𝙰𝙽𝙽𝙴𝙳**!\n• 𝚁𝚎𝚊𝚜𝚘𝚗: %3\n• 𝚃𝚒𝚖𝚎: %4",
      uidRequiredUnban: "❌ 𝚈𝚘𝚞 𝚖𝚞𝚜𝚝 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚞𝚜𝚎𝚛 𝙸𝙳 𝚝𝚘 𝚞𝚗𝚋𝚊𝚗.",
      userNotBanned: "ℹ️ 𝚄𝚜𝚎𝚛 [%1 | %2] 𝚒𝚜 𝚗𝚘𝚝 𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚋𝚊𝚗𝚗𝚎𝚍.",
      userUnbanned: "✅ 𝚄𝚜𝚎𝚛 [%1 | %2] 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 **𝚄𝙽𝙱𝙰𝙽𝙽𝙴𝙳**."
    }
  },

   

  onStart: async function ({ args, usersData, message, event, prefix, getLang }) {
    const type = args[0];

    switch (type) {
      // FIND USERS
      case "find":
      case "-f":
      case "search":
      case "-s": {
        const keyword = args.slice(1).join(" ").toLowerCase();
        if (!keyword) return message.reply("❌ Please provide a name to search.");

        const allUsers = await usersData.getAll();
        const matched = allUsers.filter(u => (u.name || "").toLowerCase().includes(keyword));
        const list = matched.map(user => `• ${user.name} (${user.userID})`).join("\n");

        return message.reply(
          matched.length === 0
            ? getLang("noUserFound", keyword)
            : getLang("userFound", matched.length, keyword, list)
        );
      }

      // BAN USER
      case "ban":
      case "-b": {
        let uid, reason;

        if (event.type === "message_reply") {
          uid = event.messageReply.senderID;
          reason = args.slice(1).join(" ");
        } else if (Object.keys(event.mentions).length > 0) {
          uid = Object.keys(event.mentions)[0];
          reason = args.slice(1).join(" ").replace(event.mentions[uid], "").trim();
        } else {
          uid = args[1];
          reason = args.slice(2).join(" ").trim();
        }

        if (!uid) return message.reply(getLang("uidRequired"));
        if (!reason) return message.reply(getLang("reasonRequired"));

        const userData = await usersData.get(uid);
        const name = userData.name || "Unknown";
        const bannedStatus = userData.banned?.status;

        if (bannedStatus) {
          return message.reply(getLang(
            "userHasBanned",
            uid,
            name,
            userData.banned.reason,
            userData.banned.date
          ));
        }

        const time = getTime("DD/MM/YYYY HH:mm:ss");

        await usersData.set(uid, {
          banned: {
            status: true,
            reason,
            date: time
          }
        });

        console.log(`[BAN] ${uid} (${name}) was banned. Reason: ${reason}`);

        return message.reply(getLang("userBanned", uid, name, reason, time));
      }

      // UNBAN USER
      case "unban":
      case "-u": {
        let uid;

        if (event.type === "message_reply") {
          uid = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
          uid = Object.keys(event.mentions)[0];
        } else {
          uid = args[1];
        }

        if (!uid) return message.reply(getLang("uidRequiredUnban"));

        const userData = await usersData.get(uid);
        const name = userData.name || "Unknown";

        if (!userData.banned?.status) {
          return message.reply(getLang("userNotBanned", uid, name));
        }

        await usersData.set(uid, { banned: {} });

        console.log(`[UNBAN] ${uid} (${name}) was unbanned.`);

        return message.reply(getLang("userUnbanned", uid, name));
      }

      // UNKNOWN TYPE
      default:
        return message.SyntaxError();
    }
  }
};
