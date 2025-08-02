const axios = require('axios');

module.exports = {
config: {
name: "online",
aliases: ["countall", "am", "line", "active", "topmsg"],
version: "1.1",
author: "Chitron Bhattacharjee",
countDown: 5,
role: 0,
shortDescription: "Show most active users",
longDescription: "Display the top 15 active members in this group based on message count",
category: "group",
guide: {
en: "{p}{n}"
}
},

onStart: async function ({ api, event }) {
const threadID = event.threadID;
const senderID = event.senderID;

try {  
  const threadInfo = await api.getThreadInfo(threadID);  
  const allIDs = threadInfo.participantIDs;  
  const msgCount = {};  

  allIDs.forEach(id => msgCount[id] = 0);  

  const history = await api.getThreadHistory(threadID, 1000);  
  for (const msg of history) {  
    const id = msg.senderID;  
    if (msgCount[id] !== undefined) msgCount[id]++;  
  }  

  const top = Object.entries(msgCount)  
    .sort((a, b) => b[1] - a[1])  
    .slice(0, 15);  

  let finalList = [];  
  for (const [id, count] of top) {  
    const info = await api.getUserInfo(id);  
    const name = info[id]?.name || "Unknown";  
    finalList.push(`${name} : ${count} messages`);  
  }  

  const msg = `📊 𝑻𝑶𝑷 𝟏𝟓 𝑨𝑪𝑻𝑰𝑽𝑬 𝑼𝑺𝑬𝑹𝑺:\n━━━━━━━━━━━━━\n\n${finalList.join('\n\n')}`;  
  api.sendMessage(msg, threadID);  
} catch (err) {  
  console.error("ActiveMember Error:", err);  
  api.sendMessage("❌ Could not fetch active members. Please try again.", threadID);  
}

}
};