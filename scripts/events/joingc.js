const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
  name: "botjoinreport",
  eventType: ["log:subscribe"],
  version: "1.0",
  category: "events",
  credits: "Chitron Bhattacharjee",
  description: "Notify support GC when bot is added to new group"
};

// Set this to your support group thread ID:
const SUPPORT_GC_ID = "9815886431866723";

module.exports.run = async function ({ api, event, Users }) {
  if (!event.logMessageData?.addedParticipants?.some(u => u.userFbId === api.getCurrentUserID())) return;

  const threadID = event.threadID;
  const threadInfo = await api.getThreadInfo(threadID);
  const threadName = threadInfo.threadName || "Unnamed Group";
  const authorID = event.author || (event.logMessageData.addedParticipants[0]?.userFbId);
  const authorName = await Users.getNameUser(authorID) || "Unknown";

  const totalMembers = threadInfo.participantIDs?.length || "??";
  const prefix = global.config?.PREFIX || "!";
  const botVersion = global.config?.version || "1.0.0";
  const botName = global.config?.BOTNAME || "YourBot";
  const time = moment.tz("Asia/Dhaka").format("DD-MM-YYYY | HH:mm:ss");

  const msg =
    `🆕 𝐁𝐎𝐓 𝐀𝐃𝐃𝐄𝐃 𝐓𝐎 𝐍𝐄𝐖 𝐆𝐂\n\n` +
    `📛 𝐆𝐂 𝐍𝐚𝐦𝐞: ${threadName}\n` +
    `🆔 𝐓𝐡𝐫𝐞𝐚𝐝 𝐈𝐃: ${threadID}\n` +
    `👤 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲: ${authorName} (${authorID})\n` +
    `👥 𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${totalMembers}\n` +
    `🕒 𝐓𝐢𝐦𝐞: ${time}\n` +
    `⚙️ 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}\n` +
    `🤖 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: ${botVersion}`;

  return api.sendMessage(msg, SUPPORT_GC_ID);
};