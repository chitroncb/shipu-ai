const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pixora",          // Random new command name
    aliases: ["pxgen", "pixa"],
    version: "1.0",
    author: "nexo_here",
    countDown: 3,
    role: 0,
    shortDescription: "Generate an AI-powered image",
    longDescription: "Use this command to create stunning AI images from your prompts.",
    category: "AI-IMAGE",
    guide: "{pn} <prompt>"
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ").trim();
    if (!prompt) 
      return api.sendMessage("⚠️ | Please provide a prompt to generate your magical image!", event.threadID, event.messageID);

    const waitMsg = await api.sendMessage("✨ Creating your masterpiece... please wait a moment ✨", event.threadID);

    try {
      const cacheDir = path.join(__dirname, "../cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const imgFilePath = path.join(cacheDir, `pixora_${Date.now()}.png`);

      const response = await axios({
        method: "GET",
        url: "https://www.arch2devs.ct.ws/api/weigen",
        params: { prompt },
        responseType: "stream"
      });

      const writer = fs.createWriteStream(imgFilePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `🎉 Your image for the prompt:\n"${prompt}"\nEnjoy your AI creation! 🌟`,
          attachment: fs.createReadStream(imgFilePath)
        }, event.threadID, () => fs.unlinkSync(imgFilePath), waitMsg.messageID);
      });

      writer.on("error", (err) => {
        console.error("❌ Error saving image:", err);
        api.sendMessage("❌ | Oops! Couldn't save your image. Please try again.", event.threadID, waitMsg.messageID);
      });
    } catch (error) {
      console.error("❌ Image generation failed:", error);
      api.sendMessage("❌ | Sorry, the image generation failed. Try again later!", event.threadID, waitMsg.messageID);
    }
  }
};