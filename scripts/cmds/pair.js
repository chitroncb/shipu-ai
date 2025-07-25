const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");

const kawaiiBackgrounds = [
  "https://i.imgur.com/vUoZLiV.jpeg",
  "https://i.imgur.com/42aI9rl.jpeg",
  "https://i.imgur.com/iZwGQbm.jpeg",
  "https://i.imgur.com/hgXWYS6.jpeg",
  "https://i.imgur.com/n27KDPz.jpeg",
  "https://i.imgur.com/MNWjhM3.jpeg",
  "https://i.imgur.com/o7jqe9m.jpeg",
  "https://i.imgur.com/JaTNSDt.jpeg",
  "https://i.imgur.com/1cak8fX.jpeg",
  "https://i.imgur.com/DeGxi5P.jpeg",
  "https://i.imgur.com/2b64zIL.jpeg",
  "https://i.imgur.com/ZjU73BR.jpeg",
  "https://i.imgur.com/7WGf1dZ.jpeg",
  "https://i.imgur.com/4pRFuL3.jpeg",
  "https://i.imgur.com/Szh32mx.jpeg",
  "https://i.imgur.com/bfMLzPk.jpeg",
  "https://i.imgur.com/El0uKyg.jpeg",
  "https://i.imgur.com/WkL7RQX.jpeg",
  "https://i.imgur.com/uBl8bV8.jpeg"
];

module.exports = {
  config: {
    name: "pair",
    version: "1.4",
    author: "Chitron Bhattacharjee",
    role: 0,
    shortDescription: {
      en: "Anime-style gender-based love pairing"
    },
    description: {
      en: "Matches you with an opposite gender member and shows cute anime-style result"
    },
    category: "love",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const senderID = event.senderID;
    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const userInfo = await api.getUserInfo(senderID);
    const senderGender = userInfo[senderID]?.gender;
    const botID = api.getCurrentUserID();

    const candidates = allUsers.filter(p => p.id !== senderID && p.id !== botID);

    const filteredCandidates = await Promise.all(
      candidates.map(async (user) => {
        const info = await api.getUserInfo(user.id);
        const gender = info[user.id]?.gender;
        return { id: user.id, gender };
      })
    );

    const oppositeGenderCandidates = filteredCandidates.filter(p => {
      return (senderGender === 1 && p.gender === 2) || (senderGender === 2 && p.gender === 1);
    });

    if (!oppositeGenderCandidates.length) {
      return api.sendMessage("❗ 𝙉𝙤 𝙫𝙖𝙡𝙞𝙙 𝙤𝙥𝙥𝙤𝙨𝙞𝙩𝙚-𝙜𝙚𝙣𝙙𝙚𝙧 𝙢𝙖𝙩𝙘𝙝 𝙛𝙤𝙪𝙣𝙙! ʕ•́ᴥ•̀ʔっ", event.threadID);
    }

    const matched = oppositeGenderCandidates[Math.floor(Math.random() * oppositeGenderCandidates.length)];
    const matchedID = matched.id;

    const senderInfo = await usersData.get(senderID);
    const matchedInfo = await usersData.get(matchedID);
    const name1 = senderInfo?.name || "You";
    const name2 = matchedInfo?.name || "Someone";

    const loveOptions = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    const lovePercent = Math.random() < 0.8 ? Math.floor(Math.random() * 100) + 1 : loveOptions[Math.floor(Math.random() * loveOptions.length)];

    const avt1 = await axios.get(`https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
    const avt2 = await axios.get(`https://graph.facebook.com/${matchedID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });

    const bgWidth = 1280;
    const bgHeight = 720;
    const canvas = createCanvas(bgWidth, bgHeight);
    const ctx = canvas.getContext("2d");

    const randomBg = kawaiiBackgrounds[Math.floor(Math.random() * kawaiiBackgrounds.length)];
    const bgImage = await loadImage(randomBg);
    ctx.drawImage(bgImage, 0, 0, bgWidth, bgHeight);

    const img1 = await loadImage(Buffer.from(avt1.data, "utf-8"));
    const img2 = await loadImage(Buffer.from(avt2.data, "utf-8"));

    // Avatar 1
    ctx.save();
    ctx.beginPath();
    ctx.arc(350, 360, 160, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img1, 190, 200, 320, 320);
    ctx.restore();
    ctx.strokeStyle = "#ff80ab";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(350, 360, 160, 0, Math.PI * 2);
    ctx.stroke();

    // Avatar 2
    ctx.save();
    ctx.beginPath();
    ctx.arc(930, 360, 160, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img2, 770, 200, 320, 320);
    ctx.restore();
    ctx.strokeStyle = "#ff80ab";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(930, 360, 160, 0, Math.PI * 2);
    ctx.stroke();

    // Footer
    ctx.font = "bold 64px 'Segoe UI Emoji'";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("💌 Love: " + lovePercent + "% 💌", bgWidth / 2, 640);
    ctx.fillText("💞 Kiss Kiss 💞", bgWidth / 2, 700);

    const imgPath = `${__dirname}/tmp/pair_result.png`;
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imgPath, buffer);

    const resultText = `
╭─━━─【💘 𝑲𝒂𝒘𝒂𝒊𝒊 𝑷𝒂𝒊𝒓 𝑭𝒐𝒖𝒏𝒅 💘】─━━─╮
✨ Name 1: 『${name1}』
🌸 Name 2: 『${name2}』
💖 Love %: ${lovePercent}％
🌈 Wishing 100 years together
╰─━━━━━━━━━━━━━━━━━━━─╯
Made by ✧༚ Chitron Bhattacharjee ✧༚`;

    return api.sendMessage({
      body: resultText,
      mentions: [{ tag: name2, id: matchedID }],
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
  }
};
