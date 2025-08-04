const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "sd",
    aliases: ["sdl", "sdb", "simg"],
    author: "redwan",
    version: "1.0",
    cooldowns: 20,
    role: 0,
    shortDescription: "Generate an image using the SD model based on a prompt.",
    longDescription: "Generates an image using the SD model with the provided prompt.",
    category: "fun",
    guide: "{p}sd <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
    const obfuscatedAuthor = String.fromCharCode(114, 101, 100, 119, 97, 110);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ | You need to provide a prompt.", event.threadID);
    }

    api.sendMessage("🔄 | Generating your image, please wait...", event.threadID, event.messageID);

    try {
      const sdApiUrl = `https://global-redwans-apis.onrender.com/api/sd?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(sdApiUrl, {
        responseType: "arraybuffer",
      });

      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: `✅ | Here is your generated image for: "${prompt}"`,
        attachment: stream,
      }, () => {
        fs.unlinkSync(imagePath);
      });

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred while generating the image. Please try again later.");
    }
  }
};