const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
config: {
name: "genimg",
version: "1.0",
countDown: 5,
role: 0,
shortDescription: { en: "Generate image using prompt" },
longDescription: { en: "Generate a new image based on your prompt." },
category: "image",
guide: { en: "{p}gen [prompt]" }
},

onStart: async function ({ args, message }) {
const prompt = args.join(" ");
if (!prompt) return message.reply("⚠️ | Please provide a prompt to generate an image.");

const imgPath = path.join(__dirname, "cache", `${Date.now()}_gen.jpg`);
const waitMsg = await message.reply(`🎨 Generating image for: "${prompt}"...\nPlease wait...`);

try {
const imageUrl = `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}`;
const res = await axios.get(imageUrl, { responseType: "arraybuffer" });

await fs.ensureDir(path.dirname(imgPath));
await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

await message.reply({
body: `✅ | Generated image for: "${prompt}"`,
attachment: fs.createReadStream(imgPath)
});

} catch (err) {
console.error("GEN Error:", err);
message.reply("❌ | Failed to generate image. Please try again later.");
} finally {
await fs.remove(imgPath);
message.unsend(waitMsg.messageID);
}
}
};
