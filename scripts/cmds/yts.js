const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "yts",
    version: "1.7",
    author: "Chitron Bhattacharjee",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "🎬 YouTube MP4 downloader"
    },
    description: {
      en: "Auto-download 360p MP4 from YouTube link or search query"
    },
    category: "media",
    guide: {
      en: "yts <link or keywords>\n\nAlso auto-downloads if someone sends a YouTube link."
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const query = args.join(" ");
    const ytLink = messageReply?.body?.match(youtubeRegex())?.[0] || query.match(youtubeRegex())?.[0];

    if (ytLink) return handleDownload(api, event, ytLink);

    if (!query)
      return api.sendMessage("❌ Please provide a YouTube link or search keyword.", threadID, messageID);

    try {
      const searchHTML = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
      const videoId = searchHTML.data.match(/"videoId":"(.*?)"/)?.[1];

      if (!videoId)
        return api.sendMessage("🐼 No video found for your search.", threadID, messageID);

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      return handleDownload(api, event, videoUrl);

    } catch (err) {
      console.error(err);
      return api.sendMessage("🐷 Error: " + err.message, threadID, messageID);
    }
  },

  onChat: async function ({ api, event }) {
    const body = event.body || "";

    // ✅ If someone sends a message like: "yts obosthan"
    if (body.toLowerCase().startsWith("yts ")) {
      const args = body.slice(3).trim().split(/\s+/);
      return module.exports.onStart({ api, event, args });
    }

    // ✅ If someone sends a YouTube link directly — no prefix
    const ytMatch = body.match(youtubeRegex());
    if (ytMatch?.[0]) {
      return handleDownload(api, event, ytMatch[0]);
    }
  }
};

// === 🔽 Shared functions ===

function youtubeRegex() {
  return /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi;
}

async function handleDownload(api, event, videoUrl) {
  const { threadID, messageID } = event;

  try {
    const res = await axios.get(`https://www.nazrul-xyz.run.place/nazrul/ytMp4?url=${encodeURIComponent(videoUrl)}`);
    const { status, title, format, quality, d_url, author } = res.data;

    if (status !== "Finished" || !d_url)
      return api.sendMessage("❌ Couldn't get download link.", threadID, messageID);

    const fileName = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40) + ".mp4";
    const filePath = path.join(__dirname, "cache", fileName);

    if (!fs.existsSync(filePath)) {
      const file = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        https.get(d_url, (res) => {
          res.pipe(file);
          file.on("finish", resolve);
          file.on("error", reject);
        });
      });
    }

    const msg = `🎬 𝗧𝗶𝘁𝗹𝗲: ${title}\n📥 𝗤𝘂𝗮𝗹𝗶𝘁𝘆: ${quality}\n🎞️ 𝗙𝗼𝗿𝗺𝗮𝘁: ${format}\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: Chitron Bhattacharya`;

    return api.sendMessage({
      body: msg,
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Download failed.\n" + err.message, threadID, messageID);
  }
}