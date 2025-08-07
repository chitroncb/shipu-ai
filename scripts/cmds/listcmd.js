const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const Canvas = require("canvas");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "list",
    version: "4.0",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Canvas help menu with paging & detailed cmd images" },
    description: { en: "Show command list pages or command details as images" },
    category: "system",
    guide: { en: "{pn} [page|command]" }
  },

  onStart: async function ({ message, args }) {
    const t0 = Date.now();

    const commands = global.GoatBot?.commands;
    const aliases = global.GoatBot?.aliases;
    if (!commands) return message.reply("❌ Command list unavailable.");

    const fontDir = path.join(__dirname, "cache", "fonts");
    const fontPath = path.join(fontDir, "DejaVuSans-Bold.ttf");
    const fontURL = "https://raw.githubusercontent.com/itscbthebrand/shipu-ai/refs/heads/main/DejaVuSans-Bold.ttf";

    // Ensure font downloaded & registered
    try {
      if (!fs.existsSync(fontPath)) {
        await fs.ensureDir(fontDir);
        const res = await axios.get(fontURL, { responseType: "arraybuffer" });
        fs.writeFileSync(fontPath, res.data);
      }
    } catch (e) {
      return message.reply(`❌ Font download failed: ${e.message}`);
    }
    Canvas.registerFont(fontPath, { family: "DejaVu" });

    // Helpers for drawing text with word wrap
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(" ");
      let line = "";
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
      return y + lineHeight;
    }

    // Detect input: number = page, else command detail
    if (!args[0]) args[0] = "1";
    const input = args[0].toLowerCase();

    const isPage = /^\d+$/.test(input);

    if (isPage) {
      // --- Render paged command list ---
      const page = Math.max(1, parseInt(input));
      const cmdList = Array.from(commands.values())
        .filter(cmd => cmd.config?.name)
        .sort((a, b) => a.config.name.localeCompare(b.config.name));

      const commandsPerPage = 25;
      const totalPages = Math.ceil(cmdList.length / commandsPerPage);

      if (page > totalPages)
        return message.reply(`❌ Page ${page} out of range. Total pages: ${totalPages}`);

      const cmdsOnPage = cmdList.slice((page - 1) * commandsPerPage, page * commandsPerPage);

      // Create canvas
      const width = 800;
      const height = 1200;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f2027");
      gradient.addColorStop(0.5, "#203a43");
      gradient.addColorStop(1, "#2c5364");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px DejaVu";
      ctx.fillText("ShiPu AI - Help Panel", 50, 80);
      ctx.font = "bold 30px DejaVu";
      ctx.fillText("─".repeat(30), 50, 110);

      // Commands list
      ctx.font = "bold 26px DejaVu";
      ctx.fillStyle = "#e0e0e0";
      let y = 160;
      for (const cmd of cmdsOnPage) {
        const line = `➤ ${cmd.config.name.padEnd(14)} (${cmd.config.category || "uncategorized"})`;
        ctx.fillText(line, 60, y);
        y += 36;
      }

      // Footer
      const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      ctx.font = "bold 24px DejaVu";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("─".repeat(25), 50, height - 100);
      ctx.fillText(`📅 Created: ${now}`, 50, height - 60);
      ctx.fillText(`⚙️ By ShiPu Ai in ${elapsed}s`, 50, height - 30);

      const filePath = path.join(__dirname, `cache/help2_page${page}.jpg`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/jpeg", { quality: 0.95 }));

      return message.reply({
        body: `📚 𝗛𝗲𝗹𝗽 𝗜𝗺𝗮𝗴𝗲 - Page ${page} / ${totalPages}\n📅 Created: ${now}\n🤖 By ShiPu Ai in ${elapsed}s`,
        attachment: fs.createReadStream(filePath)
      });

    } else {
      // --- Render detailed command info ---

      const cmd = commands.get(input) || commands.get(aliases.get(input));
      if (!cmd) return message.reply(`❌ Command "${input}" not found.`);

      const c = cmd.config;
      const prefix = global.utils.getPrefix ? global.utils.getPrefix(message.threadID) : "+";

      const desc = c.longDescription?.en || c.description?.en || "No description available.";
      const guide = c.guide?.en || "No usage guide.";
      const usage = guide.replace(/{pn}/g, prefix).replace(/{p}/g, prefix).replace(/{n}/g, c.name);

      const roleText = (() => {
        switch (c.role) {
          case 0: return "All users";
          case 1: return "Group admins";
          case 2: return "Bot admin";
          default: return "Unknown";
        }
      })();

      const aliasesText = cmd.aliases ? cmd.aliases.join(", ") : (c.aliases ? c.aliases.join(", ") : "None");

      // Create canvas
      const width = 800;
      const height = 1000;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f2027");
      gradient.addColorStop(0.5, "#203a43");
      gradient.addColorStop(1, "#2c5364");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px DejaVu";
      ctx.fillText(`Command: ${c.name}`, 50, 80);
      ctx.font = "bold 30px DejaVu";
      ctx.fillText("─".repeat(30), 50, 110);

      // Details text
      ctx.font = "bold 26px DejaVu";
      ctx.fillStyle = "#e0e0e0";

      let y = 160;
      y = wrapText(ctx, `Description: ${desc}`, 50, y, width - 100, 36);
      y = wrapText(ctx, `Category: ${c.category || "none"}`, 50, y + 10, width - 100, 36);
      y = wrapText(ctx, `Aliases: ${aliasesText}`, 50, y + 10, width - 100, 36);
      y = wrapText(ctx, `Role: ${roleText}`, 50, y + 10, width - 100, 36);
      y = wrapText(ctx, `Version: ${c.version || "1.0"}`, 50, y + 10, width - 100, 36);
      y = wrapText(ctx, `Cooldown: ${c.countDown || 0}s`, 50, y + 10, width - 100, 36);
      y = wrapText(ctx, `Author: ${c.author || "Unknown"}`, 50, y + 10, width - 100, 36);

      y = wrapText(ctx, `Usage:\n${usage}`, 50, y + 20, width - 100, 36);

      // Footer
      const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      ctx.font = "bold 24px DejaVu";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("─".repeat(25), 50, height - 100);
      ctx.fillText(`📅 Created: ${now}`, 50, height - 60);
      ctx.fillText(`⚙️ By ShiPu Ai in ${elapsed}s`, 50, height - 30);

      const filePath = path.join(__dirname, `cache/help2_cmd_${c.name}.jpg`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/jpeg", { quality: 0.95 }));

      return message.reply({
        body: `📚 𝗛𝗲𝗹𝗽 𝗗𝗲𝘁𝗮𝗶𝗹𝘀 - Command: ${c.name}\n📅 Created: ${now}\n🤖 By ShiPu Ai in ${elapsed}s`,
        attachment: fs.createReadStream(filePath)
      });
    }
  }
};