const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "mangalook",
    aliases: ["manlook", "mangainfo", "animanga"],
    version: "1.1",
    author: "Chitron Bhattacharjee 🐐✨",
    countDown: 0,
    role: 0,
    description: "🔍 Search detailed Manga info using AniList API",
    category: "anime",
    guide: {
      en: "{pn} [manga name] — search manga details from AniList"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ").trim();
    if (!query) 
      return api.sendMessage("🔎 𝓟𝓵𝓮𝓪𝓼𝓮 𝓹𝓻𝓸𝓿𝓲𝓭𝓮 𝓪 𝓶𝓪𝓷𝓰𝓪 𝓷𝓪𝓶𝓮 𝓽𝓸 𝓼𝓮𝓪𝓻𝓬𝓱.", event.threadID);

    const anilistQuery = `
      query ($search: String) {
        Media(search: $search, type: MANGA) {
          title {
            romaji
            english
            native
          }
          description(asHtml: false)
          status
          chapters
          volumes
          averageScore
          genres
          siteUrl
          coverImage {
            large
          }
        }
      }
    `;

    const variables = { search: query };

    try {
      const res = await axios.post("https://graphql.anilist.co", {
        query: anilistQuery,
        variables
      });

      const manga = res.data.data.Media;
      if (!manga) 
        return api.sendMessage("❌ 𝓝𝓸 𝓶𝓪𝓷𝓰𝓪 𝓯𝓸𝓾𝓷𝓭 𝔀𝓲𝓽𝓱 𝓽𝓱𝓲𝓼 𝓷𝓪𝓶𝓮. 𝓟𝓵𝓮𝓪𝓼𝓮 𝓬𝓱𝓮𝓬𝓴 𝓪𝓷𝓭 𝓽𝓻𝔂 𝓪𝓰𝓪𝓲𝓷.", event.threadID);

      const title = manga.title.english || manga.title.romaji || manga.title.native || "Unknown Title";
      const description = (manga.description || "No description available.")
        .replace(/<br>/g, "\n")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .slice(0, 300) + (manga.description.length > 300 ? "..." : "");

      const msg = 
        `📚 𝗠𝗮𝗻𝗴𝗮 𝗟𝗼𝗼𝗸𝘂𝗽 — 𝙰𝚗𝚒𝙻𝚒𝚜𝚝\n\n` +
        `📖 𝙏𝙞𝙩𝙡𝙚: ${title}\n` +
        `📌 𝙎𝙩𝙖𝙩𝙪𝙨: ${manga.status}\n` +
        `📚 𝙎𝙝𝙤𝙬𝙨 𝙘𝙝𝙖𝙥𝙩𝙚𝙧𝙨 & 𝙫𝙤𝙡𝙪𝙢𝙚𝙨:\n 𝘾𝘩𝑎𝑝𝑡𝑒𝑟𝑠: ${manga.chapters || "?"} | 𝙑𝙤𝙡𝙪𝙢𝙚𝙨: ${manga.volumes || "?"}\n` +
        `⭐ 𝘼𝙫𝙚𝙧𝙖𝙜𝙚 𝙎𝙘𝙤𝙧𝙚: ${manga.averageScore || "?"}/100\n` +
        `🎭 𝙂𝙚𝙣𝙧𝙚𝙨: ${manga.genres.length ? manga.genres.join(", ") : "Unknown"}\n\n` +
        `📝 𝘿𝙚𝙨𝙘𝙧𝙞𝙥𝙩𝙞𝙤𝙣:\n${description}\n\n` +
        `🔗 𝙈𝙤𝙧𝙚 𝙖𝙩: ${manga.siteUrl}`;

      // Download image
      const cover = manga.coverImage.large;
      const imgData = await axios.get(cover, { responseType: "arraybuffer" });
      const imgPath = __dirname + "/cache/mangalook.jpg";

      await fs.promises.mkdir(__dirname + "/cache", { recursive: true });
      fs.writeFileSync(imgPath, Buffer.from(imgData.data));

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imgPath),
      }, event.threadID, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error("MangaLookup Error:", err);
      return api.sendMessage("❌ 𝓕𝓪𝓲𝓵𝓮𝓭 𝓽𝓸 𝓯𝓮𝓽𝓬𝓱 𝓶𝓪𝓷𝓰𝓪 𝓲𝓷𝓯𝓸. 𝓟𝓵𝓮𝓪𝓼𝓮 𝓽𝓻𝔂 𝓪𝓰𝓪𝓲𝓷 𝓵𝓪𝓽𝓮𝓻.", event.threadID);
    }
  }
};