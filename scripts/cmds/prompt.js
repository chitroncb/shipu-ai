const axios = require("axios");

const getBaseApi = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "prompt",
    aliases: ["p"],
    version: "1.7",
    author: "𝓒𝓱𝓲𝓽𝓻𝓸𝓷 𝓑𝓱𝓪𝓽𝓽𝓪𝓬𝓱𝓪𝓻𝓳𝓮𝓮 🐐✨",
    category: "ai",
    guide: {
      en: "{pn} reply with an image to generate prompt text ✨",
    },
  },

  onStart: async function ({ api, args, event }) {
    const apiUrl = `${await getBaseApi()}/api/prompt`;
    let prompt = args.join(" ").trim() || "Describe this image";

    if (event.type === "message_reply" && event.messageReply.attachments?.[0]?.type === "photo") {
      try {
        const response = await axios.post(apiUrl, {
          imageUrl: event.messageReply.attachments[0].url,
          prompt,
        }, {
          headers: {
            "Content-Type": "application/json",
            "author": module.exports.config.author,
          }
        });

        const replyText = response.data.error || response.data.response || "❓ No response from API.";
        api.sendMessage(`✨ ${replyText}`, event.threadID, event.messageID);
        return api.setMessageReaction("🪽", event.messageID, () => {}, true);

      } catch (error) {
        console.error("Prompt API error:", error);
        api.sendMessage("❌ 𝓢𝓸𝓻𝓻𝔂, 𝓼𝓸𝓶𝓮𝓽𝓱𝓲𝓷𝓰 𝔀𝓮𝓷𝓽 𝔀𝓻𝓸𝓷𝓰 🥹", event.threadID, event.messageID);
        return api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
    } else {
      api.sendMessage("🖼️ 𝓟𝓵𝓮𝓪𝓼𝓮 𝓻𝓮𝓹𝓵𝔂 𝔀𝓲𝓽𝓱 𝓪𝓷 𝓲𝓶𝓪𝓰𝓮 𝓽𝓸 𝓰𝓮𝓷𝓮𝓻𝓪𝓽𝓮 𝓪 𝓹𝓻𝓸𝓶𝓹𝓽!", event.threadID, event.messageID);
    }
  }
};