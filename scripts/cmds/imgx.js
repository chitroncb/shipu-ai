const axios = require("axios");

module.exports = {
  config: {
    name: "imgx",
    version: "1.2",
    author: "Chitron Bhattacharjee", // 🧸🌸✨
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Generate AI images from text"
    },
    longDescription: {
      en: "Generate 1–10 AI images using prompt and optional quantity"
    },
    category: "ai-image",
    guide: {
      en: "Use: +imgx prompt | quantity\nExample: +imgx cute neko girl | 4"
    }
  },

  onStart: async function ({ api, args, message, event }) {
    try {
      const text = args.join(" ");
      if (!text) {
        return message.reply("⚠️ Please provide a prompt.");
      }

      let prompt, quantity;
      if (text.includes("|")) {
        [prompt, quantity] = text.split("|").map(str => str.trim());
        quantity = parseInt(quantity);
        if (isNaN(quantity) || quantity < 1 || quantity > 10) {
          return message.reply("⚠️ Quantity must be a number between 1 and 10.");
        }
      } else {
        prompt = text;
        quantity = 4; // default value
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      const wait = await message.reply(`🎨 𝓖𝓮𝓷𝓮𝓻𝓪𝓽𝓲𝓷𝓰 ${quantity} 𝓲𝓶𝓪𝓰𝓮(𝓼) 𝓯𝓸𝓻:\n🌸 『 ${prompt} 』`);

      const imageUrls = [];
      const ratio = "1:1";

      for (let i = 0; i < quantity; i++) {
        const res = await axios.get(`https://www.ai4chat.co/api/image/generate`, {
          params: {
            prompt,
            aspect_ratio: ratio
          }
        });

        if (res.data?.image_link) {
          imageUrls.push(res.data.image_link);
        }
      }

      const imageStreams = await Promise.all(
        imageUrls.map(url => global.utils.getStreamFromURL(url))
      );

      await message.reply({ attachment: imageStreams });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      await api.unsendMessage(wait.messageID);

    } catch (error) {
      console.error("Image generation error:", error.message || error);
      return message.reply("❌ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓰𝓮𝓷𝓮𝓻𝓪𝓽𝓮 𝓲𝓶𝓪𝓰𝓮(𝓼). 𝓣𝓻𝔂 𝓪𝓰𝓪𝓲𝓷 𝓵𝓪𝓽𝓮𝓻.");
    }
  }
};