const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: ["imgedit", "art", "artify"],
    version: "1.3",
    author: "Chitron Bhattacharjee",
    countDown: 20,
    role: 0,
    shortDescription: {
      en: "✨ Kawaii image edit"
    },
    longDescription: {
      en: "🖼️ Reply to an image and give a magical anime‑style edit prompt 💫"
    },
    category: "🖌️ Image",
    guide: {
      en: "💬 Reply to an image:\n+edit <your anime prompt>\n💡 Example: +edit cute magical girl style"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    if (!event.messageReply || event.messageReply.attachments.length === 0)
      return message.reply("💢 𝙃𝙚𝙮~ 𝙮𝙤𝙪 𝙣𝙚𝙚𝙙 𝙩𝙤 𝙧𝙚𝙥𝙡𝙮 𝙩𝙤 𝙖𝙣 𝙞𝙢𝙖𝙜𝙚 ✨");

    const prompt = args.join(" ").trim();
    if (!prompt)
      return message.reply("📌 𝙋𝙡𝙚𝙖𝙨𝙚 𝙖𝙙𝙙 𝙖𝙣 𝙚𝙙𝙞𝙩 𝙥𝙧𝙤𝙢𝙥𝙩 💬");

    const imageUrl = event.messageReply.attachments[0].url;
    const userData = await usersData.get(event.senderID) || {};
    const balance  = userData.money || 0;

    if (balance < 100)
      return message.reply("💸 𝙉𝙤𝙩 𝙚𝙣𝙤𝙪𝙜𝙝 𝙘𝙤𝙞𝙣𝙨~! 𝙔𝙤𝙪 𝙣𝙚𝙚𝙙 𝟏𝟎𝟎 💰");

    await usersData.set(event.senderID, { money: balance - 100 });

    api.sendMessage(
      "💰 𝟏𝟎𝟎 𝙘𝙤𝙞𝙣𝙨 𝙙𝙚𝙙𝙪𝙘𝙩𝙚𝙙 𝙛𝙤𝙧 𝙖𝙣𝙞𝙢𝙚 𝙚𝙙𝙞𝙩~ ✨",
      event.threadID,
      (e, info) => !e && setTimeout(() => api.unsendMessage(info.messageID), 10_000)
    );

    message.reply("🪄 𝙃𝙤𝙡𝙙 𝙤𝙣~ 𝙘𝙪𝙩𝙚 𝙚𝙙𝙞𝙩𝙞𝙣𝙜 𝙞𝙣 𝙥𝙧𝙤𝙜𝙧𝙚𝙨𝙨... 💞");

    const cache = path.join(__dirname, "cache");
    if (!fs.existsSync(cache)) fs.mkdirSync(cache);

    const file = path.join(cache, `${Date.now()}_anime_edit.jpg`);

    const tryAPI = async (url) => {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(file, Buffer.from(res.data, "binary"));
    };

    try {
      // Try Main API
      const mainURL = `https://mahi-apis.onrender.com/api/edit?url=${encodeURIComponent(imageUrl)}&txt=${encodeURIComponent(prompt)}`;
      await tryAPI(mainURL);
    } catch (err) {
      console.warn("⚠️ Main API failed. Trying fallback...");
      try {
        const fallbackURL = `https://edit-and-gen.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`;
        await tryAPI(fallbackURL);
      } catch (e2) {
        console.error("❌ Fallback API failed too:", e2);
        return message.reply("🚫 𝙐𝙝‑𝙤𝙝! 𝘽𝙤𝙩𝙝 𝙀𝘿𝙄𝙏 𝘼𝙋𝙄𝙨 𝙛𝙖𝙞𝙡𝙚𝙙. 𝙏𝙧𝙮 𝙖𝙜𝙖𝙞𝙣 𝙡𝙖𝙩𝙚𝙧 💔");
      }
    }

    return message.reply({
      body: `🌸 𝘌𝘥𝘪𝘵 𝘊𝘰𝘮𝘱𝘭𝘦𝘵𝘦~!\n✨ 𝘗𝘳𝘰𝘮𝘱𝘵: 『${prompt}』`,
      attachment: fs.createReadStream(file)
    });
  },

  onChat: async function (context) {
    const { event, args } = context;

    if (event.type !== "message_reply" || !event.messageReply.attachments[0]?.type?.includes("photo"))
      return;

    const cmd = (args[0] || "").toLowerCase();
    const keys = ["edit", "imgedit", "art", "artify"];
    if (!keys.includes(cmd)) return;

    args.shift();
    return this.onStart({ ...context, args });
  }
};