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

async function ensureFont(url, savePath, family) {
  try {
    if (!fs.existsSync(savePath)) {
      await fs.ensureDir(path.dirname(savePath));
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
      await fsp.writeFile(savePath, Buffer.from(res.data));
    }
    Canvas.registerFont(savePath, { family });
    console.log(`[REQ_DEBUG] Registered font: ${family}`);
  } catch (err) {
    console.error(`[REQ_DEBUG] Failed to download/register font ${family}:`, err.message || err);
    // continue with fallback fonts if fails
  }
}

module.exports = {
  config: {
    name: "req",
    version: "1.2",
    author: "Chitron Bhattacharjee",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Send group request styled image" },
    longDescription: { en: "Generate and send a styled group request image with group info" },
    category: "group",
    guide: { en: "{pn} your request message" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, senderID } = event;
    const textMessage = args.join(" ").trim() || "🔔 I have a request to make in this group!";

    const CACHE_DIR = path.join(__dirname, "cache", "reqimg");
    await fs.ensureDir(CACHE_DIR);

    await ensureFont(NOTO_REG_URL, path.join(FONT_DIR, NOTO_REG_NAME), "NotoSans");
    await ensureFont(NOTO_BN_URL, path.join(FONT_DIR, NOTO_BN_NAME), "NotoSansBengali");

    async function fetchImageBuffer(url) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
        return Buffer.from(res.data);
      } catch (err) {
        throw err;
      }
    }

    async function getAvatarBuffer(uid) {
      const primaryUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      try {
        const buf = await fetchImageBuffer(primaryUrl);
        if (buf && buf.length > 200) return buf;
        throw new Error("Primary avatar buffer too small");
      } catch (errPrimary) {
        console.warn(`[REQ_DEBUG] Primary avatar fetch failed for ${uid}: ${errPrimary.message || errPrimary}`);
        try {
          const fallbackUrl = `https://kaiz-apis.gleeze.com/api/facebookpfp?uid=${uid}&apikey=66e0cfbb-62b8-4829-90c7-c78cacc72ae2`;
          const buf2 = await fetchImageBuffer(fallbackUrl);
          if (buf2 && buf2.length > 200) return buf2;
          throw new Error("Fallback avatar buffer too small");
        } catch (errFallback) {
          console.error(`[REQ_DEBUG] Fallback avatar fetch failed for ${uid}: ${errFallback.message || errFallback}`);
          return null;
        }
      }
    }

    // ====== HERE IS THE ONLY ADDED PART: resolve UID for avatar like profile command ======
    let uid;
    try {
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else if (args.join(" ").includes("facebook.com")) {
        const match = args.join(" ").match(/(\d+)/);
        if (match) uid = match[0];
        else throw new Error("Invalid Facebook URL.");
      } else if (args[0]) {
        uid = args[0];
      } else {
        uid = senderID;
      }
    } catch (err) {
      console.warn("[REQ_DEBUG] Failed to resolve avatar UID:", err.message || err);
      uid = senderID;
    }
    // ================================================================================

    async function buildRequestImage({ groupInfo, senderInfo, msgText, avatarBuffer, groupAvatarBuffer }) {
      const width = 1000;
      const height = 600;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#fff5fb");
      grad.addColorStop(1, "#fff0f8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(ctx, 20, 20, width - 40, height - 40, 20, true, false);

      if (groupAvatarBuffer) {
        try {
          const img = await Canvas.loadImage(groupAvatarBuffer);
          drawCircularImage(ctx, img, 50, 50, 120);
        } catch (e) {
          console.warn("[REQ_DEBUG] group avatar draw failed:", e.message || e);
        }
      } else {
        ctx.fillStyle = "#ffd6ec";
        roundRect(ctx, 50, 50, 120, 120, 16, true, false);
      }

      ctx.fillStyle = "#d10068";
      ctx.font = detectBengali(msgText + groupInfo.name) ? `bold 36px "NotoSansBengali", "NotoSans"` : `bold 36px "NotoSans"`;
      ctx.fillText(safeText(groupInfo.name), 200, 95);

      ctx.fillStyle = "#444";
      ctx.font = `20px "NotoSans"`;
      ctx.fillText(`👥 Members: ${groupInfo.memberCount}`, 200, 130);
      ctx.fillText("👑 Admins:", 200, 160);
      const admins = groupInfo.admins || [];
      admins.slice(0, 6).forEach((a, i) => {
        ctx.fillText(`• ${safeText(a)}`, 220, 190 + i * 24);
      });

      ctx.fillStyle = "#fff0f6";
      roundRect(ctx, 30, 300, width - 60, 200, 12, true, false);

      ctx.fillStyle = "#111";
      ctx.font = detectBengali(msgText) ? `20px "NotoSansBengali", "NotoSans"` : `20px "NotoSans"`;
      ctx.fillText("📩 Message:", 50, 335);
      wrapText(ctx, msgText, 50, 360, width - 120, 26);

      if (avatarBuffer) {
        try {
          const avtImg = await Canvas.loadImage(avatarBuffer);
          drawCircularImage(ctx, avtImg, 50, 460, 80);
        } catch (e) {
          console.warn("[REQ_DEBUG] sender avatar draw failed:", e.message || e);
        }
      } else {
        ctx.fillStyle = "#ffd6ec";
        ctx.beginPath();
        ctx.arc(90, 500, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#d10068";
      ctx.font = `bold 22px "NotoSans"`;
      ctx.fillText(safeText(senderInfo.name || "Unknown Sender"), 150, 500);

      return canvas.toBuffer();
    }

    function safeText(t) {
      if (!t) return "";
      return String(t);
    }

    function detectBengali(s) {
      if (!s) return false;
      return /[\u0980-\u09FF]/.test(s);
    }

    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
      if (typeof r === "undefined") r = 5;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
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
      const words = String(text).split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), x, y);
    }

    // Get thread info
    let threadInfo = {};
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
      console.warn("[REQ_DEBUG] getThreadInfo failed:", err.message || err);
      threadInfo = { threadName: "Group Chat", participantIDs: [], userInfo: [], adminIDs: [] };
    }

    const groupInfo = {
      id: threadID,
      name: threadInfo.threadName || "Group Chat",
      memberCount: Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs.length : (threadInfo.memberCount || 0),
      admins: []
    };

    try {
      if (Array.isArray(threadInfo.userInfo) && Array.isArray(threadInfo.adminIDs)) {
        const adminSet = new Set((threadInfo.adminIDs || []).map(a => a.id || a));
        groupInfo.admins = (threadInfo.userInfo || [])
          .filter(u => adminSet.has(u.id || u.userID))
          .map(u => u.name || u.fullName || `User ${u.id || u.userID}`);
      } else if (Array.isArray(threadInfo.userInfo)) {
        groupInfo.admins = (threadInfo.userInfo || []).slice(0, 6).map(u => u.name || `User ${u.id || u.userID}`);
      }
    } catch (e) {
      console.warn("[REQ_DEBUG] admin parse failed:", e.message || e);
    }

    // Sender info
    let senderInfo = { id: uid, name: "Unknown Sender" };
    try {
      const udata = await usersData.get(uid);
      if (udata && (udata.name || udata.fullName || udata.userName)) {
        senderInfo.name = udata.name || udata.fullName || udata.userName;
      } else if (event.senderName) {
        senderInfo.name = event.senderName;
      }
    } catch (e) {
      console.warn("[REQ_DEBUG] usersData.get failed:", e.message || e);
    }

    const avatarPromise = getAvatarBuffer(uid);
    let groupAvatarPromise = null;
    if (threadInfo.imageSrc) {
      groupAvatarPromise = (async () => {
        try {
          return await fetchImageBuffer(threadInfo.imageSrc);
        } catch (e) {
          console.warn("[REQ_DEBUG] group avatar fetch failed:", e.message || e);
          return null;
        }
      })();
    } else {
      groupAvatarPromise = Promise.resolve(null);
    }

    const [avatarBuffer, groupAvatarBuffer] = await Promise.all([avatarPromise, groupAvatarPromise]);

    let finalImageBuffer = null;
    try {
      finalImageBuffer = await buildRequestImage({
        groupInfo,
        senderInfo,
        msgText: textMessage,
        avatarBuffer,
        groupAvatarBuffer
      });
    } catch (err) {
      console.error("[REQ_DEBUG] buildRequestImage failed:", err.message || err);
      return message.reply("❌ | Failed to build request image.");
    }

    const timestamp = Date.now();
    const outPath = path.join(CACHE_DIR, `req_${threadID}_${timestamp}.png`);
    try {
      await fsp.writeFile(outPath, finalImageBuffer);
    } catch (err) {
      console.error("[REQ_DEBUG] failed to write output image:", err.message || err);
    }

    async function sendToTarget(targetID, isDM) {
      try {
        await api.sendMessage({
          body: isDM ? `${threadID}` : `${threadID}`,
          attachment: fs.createReadStream(outPath)
        }, targetID);
        console.log(`[REQ_DEBUG] Sent image to ${isDM ? 'DM' : 'GC'}`);
        return true;
      } catch (err) {
        console.error(`[REQ_DEBUG] Failed to send to ${isDM ? 'DM' : 'GC'}:`, err);
        return false;
      }
    }

    const sendPromises = [
      sendToTarget(threadID, false),
      sendToTarget(uid, true)
    ];

    const [gcResult, dmResult] = await Promise.allSettled(sendPromises);

    try {
      if (fs.existsSync(outPath)) await fsp.unlink(outPath);
    } catch (e) {
      console.warn("[REQ_DEBUG] cleanup failed:", e.message || e);
    }

    if (gcResult.status === 'fulfilled' && gcResult.value) {
      await message.reply("✅ Request image processed successfully");
    } else {
      await message.reply("⚠️ Request image created but couldn't send to group");
    }
  }
};