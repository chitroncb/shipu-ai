const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "lockup",
    version: "2.0",
    author: "Chitron Bhattacharjee", // 🚓🪤👮‍♂️
    countDown: 5,
    role: 0,
    shortDescription: "Put someone in lockup",
    longDescription: "Generate a jail overlay image for a tagged or replied user",
    category: "fun",
    guide: {
      en: "{pn} @tag or reply to someone"
    }
  },

  langs: {
    en: {
      noTag: "⚠️ Please tag or reply to someone to put them in jail!"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const senderID = event.senderID;
      const replyID = event.messageReply?.senderID;
      const mentionID = Object.keys(event.mentions || {})[0];
      const targetID = replyID || mentionID;

      if (!targetID) return message.reply(getLang("noTag"));

      const avatarURL = await usersData.getAvatarUrl(targetID);
      const image = await new DIG.Jail().getImage(avatarURL);

      const cachePath = path.join(__dirname, "cache");
      const imgPath = path.join(cachePath, `${targetID}_jail.png`);

      await fs.ensureDir(cachePath);
      await fs.writeFile(imgPath, image);

      const caption = args.join(" ").replace(Object.keys(event.mentions || {})[0], "") || "🚔 𝒲𝑒𝓁𝒸𝑜𝓂𝑒 𝓉𝑜 𝒿𝒶𝒾𝓁, 𝓇𝒶𝓅𝒾𝓈𝓉 😈";

      await message.reply({
        body: caption,
        attachment: fs.createReadStream(imgPath)
      });

      await fs.unlink(imgPath);
    } catch (err) {
      console.error("Jail command error:", err);
      message.reply("❌ Something went wrong while generating the jail image.");
    }
  }
};