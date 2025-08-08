const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB schema
const ShipuMemory = mongoose.models.ShipuMemory || mongoose.model("ShipuMemory", new mongoose.Schema({
  userID: String,
  memory: String,
  personality: { type: String, default: "default" }
}));

// ✅ Updated API URL
const apiUrl = "https://shipu-ai-6hwr.onrender.com/api.php?action=";

module.exports = {
  config: {
    name: "shipu",
    aliases: ["lume", "lumyai", "lum", "ai", "শিপু"],
    version: "1.2",
    author: "Chitron Bhattacharjee",
    countDown: 1,
    role: 0,
    shortDescription: {
      en: "Talk with ShiPu AI (with memory and personality)"
    },
    longDescription: {
      en: "Chat with Lume-powered ShiPu AI. Continues chat with memory, supports personality modes."
    },
    category: "ai",
    guide: {
      en: "+shipu [message] or reply to ShiPu\n+shipu setpersonality [funny|formal|sarcastic]\nNo-prefix supported too"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const uid = event.senderID;
    const input = args.join(" ");

    if (!input)
      return message.reply("Please provide a message or reply to a ShiPu message.");

    // Personality setter
    if (args[0]?.toLowerCase() === "setpersonality") {
      const mode = args[1]?.toLowerCase();
      if (!mode)
        return message.reply("Usage: +shipu setpersonality [mode]");
      await ShipuMemory.findOneAndUpdate({ userID: uid }, { personality: mode }, { upsert: true });
      return message.reply(`Personality set to: ${mode}`);
    }

    handleConversation(api, event, input);
  },

  onReply: async function ({ api, event }) {
    const userInput = event.body?.toLowerCase();
    if (!userInput) return;
    handleConversation(api, event, userInput);
  },

  onChat: async function ({ api, event }) {
    const body = event.body?.toLowerCase();
    if (!body) return;

    const prefixes = ["shipuai", "lume", "lumyai", "lum", "ai", "shpu"];
    const matched = prefixes.find(p => body.startsWith(p));
    if (!matched) return;

    const content = body.slice(matched.length).trim();
    if (!content) {
      const prompts = [
        "হ্যাঁ বলো, শুনছি!",
        "তুমি কি জানতে চাও আমার সম্পর্কে?",
        "লিখো কিছু, আমি ভাবছি...",
        "কিছু বলো, আমি উত্তর দিবো!"
      ];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      return api.sendMessage(randomPrompt, event.threadID, (err, info) => {
        if (!info?.messageID) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "shipu",
          type: "reply",
          author: event.senderID
        });
      }, event.messageID);
    }

    handleConversation(api, event, content);
  }
};

// 🔁 Handle user conversation
async function handleConversation(api, event, userInput) {
  const uid = event.senderID;
  let memory = "";
  let personality = "default";

  try {
    const userData = await ShipuMemory.findOne({ userID: uid });
    if (userData) {
      memory = userData.memory || "";
      personality = userData.personality || "default";
    }
  } catch (err) {
    console.log("⚠️ MongoDB not connected or memory fetch failed.");
  }

  try {
    const query = memory ? `${memory}\nUser: ${userInput}` : userInput;
    const fullQuery = `[${personality} mode]\n${query}`;

    const res = await axios.get(apiUrl + encodeURIComponent(fullQuery));
    const { botReply, status } = res.data;

    if (status !== "success") {
      return api.sendMessage("ShiPu couldn't reply. Try again later.", event.threadID, event.messageID);
    }

    // Save updated memory
    try {
      const newMemory = `User: ${userInput}\nShiPu: ${botReply}`;
      await ShipuMemory.findOneAndUpdate({ userID: uid }, { memory: newMemory }, { upsert: true });
    } catch (e) {
      console.log("⚠️ Failed to save memory.");
    }

    api.sendMessage(botReply, event.threadID, (err, info) => {
      if (!info?.messageID) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "shipu",
        type: "reply",
        author: event.senderID
      });
    }, event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("Failed to contact ShiPu AI.", event.threadID, event.messageID);
  }
}