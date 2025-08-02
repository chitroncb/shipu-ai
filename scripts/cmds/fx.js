const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fx",
    version: "1.0.1",
    author: "Chitron Bhattacharjee", // 🐣🌸🦄✨
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate AI image with prompt" },
    longDescription: { en: "Generate a stunning image using the FluxDev AI API based on your prompt." },
    category: "ai-image",
    guide: { en: "+fx [your prompt]" }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("⚠️ | Please provide a prompt to generate image.", event.threadID, event.messageID);
    }

    const imagePath = path.join(__dirname, "cache", `flux_${Date.now()}.png`);
    const processingMessage = await api.sendMessage("🧠 Generating your image, please wait...", event.threadID);

    try {
      const res = await axios({
        method: "POST",
        url: "https://www.arch2devs.ct.ws/api/flux",
        headers: { "Content-Type": "application/json" },
        data: {
          prompt,
          width: 1024,
          height: 1024,
          steps: 4
        },
        responseType: "arraybuffer"
      });

      await fs.ensureDir(path.dirname(imagePath));
      await fs.writeFile(imagePath, Buffer.from(res.data, "binary"));

      return api.sendMessage({
        body: `✅ | Image generated for: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, async () => {
        await fs.unlink(imagePath);
      }, processingMessage.messageID);

    } catch (error) {
      console.error("FluxDev Error:", error.message || error);
      return api.sendMessage("❌ | Failed to generate image. Please try again later.", event.threadID, processingMessage.messageID);
    }
  }
};