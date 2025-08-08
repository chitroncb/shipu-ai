const fs = require("fs-extra");
const fsp = require("fs").promises;
const path = require("path");
const axios = require("axios");
const Canvas = require("canvas");

const FONT_DIR = path.join(__dirname, "cache", "fonts");
const NOTO_REG_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const NOTO_BN_URL = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf";
const NOTO_REG_NAME = "NotoSans-Regular.ttf";
const NOTO_BN_NAME = "NotoSansBengali-Regular.ttf";

// TARGET GROUP ID
const TARGET_GROUP_ID = "24412281618409138";

async function ensureFont(url, savePath, family) {
  try {
    if (!fs.existsSync(savePath)) {
      await fs.ensureDir(path.dirname(savePath));
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
      await fsp.writeFile(savePath, Buffer.from(res.data));
    }
    Canvas.registerFont(savePath, { family });
  } catch (err) {
    console.error(`Failed to load font ${family}:`, err.message);
  }
}

module.exports = {
  config: {
    name: "req",
    version: "1.6",
    author: "Chitron Bhattacharjee",
    countDown: 15,
    role: 0,
    shortDescription: { en: "Send styled group request image" },
    longDescription: { en: "Generate and send styled group request image with group info" },
    category: "group",
    guide: { en: "{pn} [your request message]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID: SOURCE_GROUP_ID, senderID } = event;
    const textMessage = args.join(" ").trim() || "🔔 I have a request to make!";

    const CACHE_DIR = path.join(__dirname, "cache", "reqimg");
    await fs.ensureDir(CACHE_DIR);

    // Load fonts asynchronously
    await Promise.all([
      ensureFont(NOTO_REG_URL, path.join(FONT_DIR, NOTO_REG_NAME), "NotoSans"),
      ensureFont(NOTO_BN_URL, path.join(FONT_DIR, NOTO_BN_NAME), "NotoSansBengali")
    ]);

    // UID resolution
    let uid;
    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    if (!uid) {
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } else if (Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else {
        uid = senderID;
      }
    }

    // Enhanced avatar fetching
    async function getAvatarBuffer(uid) {
      try {
        // Try GoatBot's native avatar method
        const avatarUrl = await usersData.getAvatarUrl(uid);
        if (avatarUrl) {
          const res = await axios.get(avatarUrl, { responseType: "arraybuffer", timeout: 15000 });
          const buffer = Buffer.from(res.data);
          if (buffer.length > 1024) return buffer;
        }
      } catch (e) {
        console.warn("GoatBot avatar failed:", e.message);
      }

      // Fallback to Facebook CDN
      const sizes = [512, 720, 1024];
      for (const size of sizes) {
        try {
          const url = `https://graph.facebook.com/${uid}/picture?width=${size}&height=${size}&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
          return Buffer.from(res.data);
        } catch (e) {
          console.warn(`FB CDN ${size}x${size} failed:`, e.message);
        }
      }
      
      return null;
    }

    // Get SOURCE group info (where command is triggered)
    let sourceGroupInfo;
    try {
      sourceGroupInfo = await api.getThreadInfo(SOURCE_GROUP_ID);
    } catch (err) {
      console.error("getThreadInfo failed:", err.message);
      return message.reply("❌ | Failed to get source group information.");
    }

    // Process SOURCE group info
    const sourceGroup = {
      id: SOURCE_GROUP_ID,
      name: sourceGroupInfo.threadName || "Unknown Group",
      memberCount: sourceGroupInfo.participantIDs.length,
      admins: []
    };

    try {
      const adminIDs = new Set(sourceGroupInfo.adminIDs.map(admin => admin.id));
      sourceGroup.admins = sourceGroupInfo.userInfo
        .filter(user => adminIDs.has(user.id))
        .slice(0, 6)
        .map(user => user.name);
    } catch (e) {
      console.warn("Admin parsing failed:", e.message);
    }

    // Get sender info
    let senderInfo = { name: "Unknown User" };
    try {
      const userData = await usersData.get(uid);
      senderInfo.name = userData?.name || event.senderName || "Unknown User";
    } catch (e) {
      console.warn("User data fetch failed:", e.message);
    }

    // Fetch avatars concurrently
    const [avatarBuffer, groupAvatarBuffer] = await Promise.all([
      getAvatarBuffer(uid),
      sourceGroupInfo.imageSrc ? fetchImageBuffer(sourceGroupInfo.imageSrc) : Promise.resolve(null)
    ]);

    // Canvas helper functions
    function safeText(t) {
      return t ? String(t) : "";
    }

    function detectBengali(s) {
      return /[\u0980-\u09FF]/.test(s || "");
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    }

    function drawCircularImage(ctx, img, x, y, size) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 2, 0, Math.PI * 2, true);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          ctx.fillText(line, x, y);
          line = word + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }

    // Create image with SOURCE group info
    async function buildRequestImage() {
      const width = 1000;
      const height = 600;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#fff5fb");
      grad.addColorStop(1, "#fff0f8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Card background
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      roundRect(ctx, 20, 20, width - 40, height - 40, 20);

      // Group avatar (SOURCE group)
      if (groupAvatarBuffer) {
        try {
          const img = await Canvas.loadImage(groupAvatarBuffer);
          drawCircularImage(ctx, img, 50, 50, 120);
        } catch (e) {
          console.warn("Group avatar load failed:", e.message);
        }
      } else {
        // Fallback if no group avatar
        ctx.fillStyle = "#ffd6ec";
        roundRect(ctx, 50, 50, 120, 120, 20);
      }

      // SOURCE group info
      ctx.fillStyle = "#d10068";
      ctx.font = detectBengali(sourceGroup.name) 
        ? 'bold 36px "NotoSansBengali", "NotoSans"' 
        : 'bold 36px "NotoSans"';
      ctx.fillText(safeText(sourceGroup.name), 200, 95);

      ctx.fillStyle = "#444";
      ctx.font = '20px "NotoSans"';
      ctx.fillText(`👥 Members: ${sourceGroup.memberCount}`, 200, 130);
      ctx.fillText(`🆔 ID: ${sourceGroup.id}`, 200, 160);
      ctx.fillText("👑 Admins:", 200, 190);
      
      sourceGroup.admins.slice(0, 5).forEach((admin, i) => {
        ctx.fillText(`• ${safeText(admin)}`, 220, 220 + i * 24);
      });

      // Request card
      ctx.fillStyle = "#fff0f6";
      roundRect(ctx, 30, 300, width - 60, 200, 12);

      ctx.fillStyle = "#111";
      ctx.font = detectBengali(textMessage) 
        ? '20px "NotoSansBengali", "NotoSans"' 
        : '20px "NotoSans"';
      ctx.fillText("📩 Request Message:", 50, 335);
      wrapText(ctx, textMessage, 50, 360, width - 120, 26);

      // User avatar
      if (avatarBuffer) {
        try {
          const img = await Canvas.loadImage(avatarBuffer);
          drawCircularImage(ctx, img, 50, 460, 80);
        } catch (e) {
          console.warn("User avatar load failed:", e.message);
        }
      } else {
        // Fallback if no user avatar
        ctx.fillStyle = "#ffd6ec";
        ctx.beginPath();
        ctx.arc(90, 500, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      // User name
      ctx.fillStyle = "#d10068";
      ctx.font = 'bold 22px "NotoSans"';
      ctx.fillText(safeText(senderInfo.name), 150, 500);

      // Add target group watermark
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.font = '16px "NotoSans"';
      ctx.fillText(`Request for: ${TARGET_GROUP_ID}`, width - 300, height - 20);

      return canvas.toBuffer("image/png");
    }

    async function fetchImageBuffer(url) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
        return Buffer.from(res.data);
      } catch (err) {
        console.error("Image fetch failed:", url);
        return null;
      }
    }

    try {
      const imageBuffer = await buildRequestImage();
      const outPath = path.join(CACHE_DIR, `req_${SOURCE_GROUP_ID}_${Date.now()}.png`);
      await fsp.writeFile(outPath, imageBuffer);

      // 1. Send to TARGET group (24412281618409138)
      await api.sendMessage({
        body: `📢 NEW GROUP REQUEST\n\nFrom: ${sourceGroup.name} (ID: ${SOURCE_GROUP_ID})\nSender: ${senderInfo.name}\n\nMessage: ${textMessage}`,
        attachment: fs.createReadStream(outPath)
      }, TARGET_GROUP_ID);

      // 2. Send confirmation to SOURCE group
      await message.reply({
        body: `✅ আপনার রিকোয়েস্ট টার্গেট গ্রুপে পাঠানো হয়েছে!\nটার্গেট গ্রুপ আইডি: ${TARGET_GROUP_ID}`,
        attachment: fs.createReadStream(outPath)
      });

      // 3. Send to user via DM
      try {
        await api.sendMessage({
          body: `${SOURCE_GROUP_ID}`,
          attachment: fs.createReadStream(outPath)
        }, uid);
      } catch (dmErr) {
        console.warn("Failed to send DM:", dmErr.message);
      }

      // Cleanup
      await fsp.unlink(outPath);

    } catch (err) {
      console.error("Image creation failed:", err);
      message.reply("❌ | রিকোয়েস্ট ইমেজ তৈরি করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    }
  }
};