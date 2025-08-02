const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "imggn",
    aliases: ["imggen", "imagine"],
    version: "2.0",
    author: "Chitron Bhattacharjee", // 🌸🧠🎨
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Generate AI image from prompt"
    },
    longDescription: {
      en: "Uses Imgen API to generate a beautiful image based on your text prompt"
    },
    category: "ai-image",
    guide: {
      en: "Usage:\n+imggn <your prompt>\nExample:\n+imggn Cyberpunk city at night"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("⚠️ 𝓟𝓵𝓮𝓪𝓼𝓮 𝓹𝓻𝓸𝓿𝓲𝓭𝓮 𝓪 𝓹𝓻𝓸𝓶𝓹𝓽.\n✨ Example: +imggn A dragon flying over a castle");
    }

    const tempPath = path.join(__dirname, "cache");
    const fileName = `imggn_${event.senderID}.png`;
    const filePath = path.join(tempPath, fileName);

    try {
      await fs.ensureDir(tempPath);
      const waitMsg = await message.reply("🧠 𝓖𝓮𝓷𝓮𝓻𝓪𝓽𝓲𝓷𝓰 𝔂𝓸𝓾𝓻 𝓲𝓶𝓪𝓰𝓮... 𝓹𝓵𝓮𝓪𝓼𝓮 𝔀𝓪𝓲𝓽 ⏳");

      const res = await axios({
        method: "GET",
        url: "https://www.arch2devs.ct.ws/api/imgen",
        params: { prompt },
        responseType: "arraybuffer"
      });

      await fs.writeFile(filePath, Buffer.from(res.data, "binary"));

      await message.reply({
        body: `✅ 𝓘𝓶𝓪𝓰𝓮 𝓰𝓮𝓷𝓮𝓻𝓪𝓽𝓮𝓭 𝓯𝓸𝓻:\n『 ${prompt} 』`,
        attachment: fs.createReadStream(filePath)
      });

      await fs.unlink(filePath);
      await api.unsendMessage(waitMsg.messageID);

    } catch (err) {
      console.error("❌ Imgen Error:", err.message || err);
      return message.reply("❌ 𝓢𝓸𝓻𝓻𝔂! 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓰𝓮𝓷𝓮𝓻𝓪𝓽𝓮 𝓲𝓶𝓪𝓰𝓮.\n🚫 𝓢𝓮𝓻𝓿𝓮𝓻 𝓶𝓲𝓰𝓱𝓽 𝓫𝓮 𝓸𝓿𝓮𝓻𝓵𝓸𝓪𝓭𝓮𝓭.");
    }
  }
};