const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "cmdlist",
    aliases: ["commands"],
    version: "1.0",
    author: "Chitron Bhattacharjee",
    role: 0,
    shortDescription: {
      en: "Show list of commands"
    },
    longDescription: {
      en: "Displays a categorized list of commands with or without prefix support"
    },
    category: "info",
    guide: {
      en: "{p}cmdlist\n{p}cmdlist <command name>"
    }
  },

  langs: {
    en: {
      header: "🌸 Command Overview 🌸",
      footer: "\n💡 Use `cmdlist <name>` to view full info.",
      categoryNoPrefix: "💬 No-Prefix Commands:",
      categoryPrefixOnly: "📎 Prefix-Only Commands:",
      empty: "⚠️ No commands found in this category.",
      notFound: "❌ Command '%1' not found.",
      detailTitle: "🔍 Details of: %1",
      name: "📛 Name: %1",
      aliases: "🔁 Aliases: %1",
      description: "📝 Description:\n%1",
      role: "🔐 Permission: %1",
      guide: "📘 Guide:\n%1",
      noGuide: "🚫 No guide provided.",
      version: "🔧 Version: %1"
    }
  },

  onStart: async function ({ message, args, getLang }) {
    return module.exports.handle({ message, args, getLang });
  },

  onChat: async function ({ message, event, getLang }) {
    const content = (event.body || "").trim().toLowerCase();
    if (!content.startsWith("cmdlist")) return;

    const splitArgs = content.split(/\s+/).slice(1);
    return module.exports.handle({ message, args: splitArgs, getLang });
  },

  handle: async function ({ message, args, getLang }) {
    if (args.length === 0) {
      const noPrefix = [], prefixOnly = [];
      const short = (name) => name.length > 10 ? name.slice(0, 7) + "..." : name;

      for (const [, cmd] of commands) {
        const cfg = cmd.config;
        const desc = cfg.shortDescription?.en || "No description";
        const info = `• ${short(cfg.name).padEnd(10)} : ${desc}`;
        if (typeof cmd.onChat === "function") noPrefix.push(info);
        else prefixOnly.push(info);
      }

      const addBars = (arr) => {
        const res = [];
        for (let i = 0; i < arr.length; i++) {
          res.push(arr[i]);
          if ((i + 1) % 3 === 0 && i !== arr.length - 1) res.push("██████████—🌸");
        }
        return res.join("\n");
      };

      const msg = [
        getLang("header"),
        "",
        `${getLang("categoryNoPrefix")}\n${noPrefix.length ? addBars(noPrefix) : getLang("empty")}`,
        "",
        `${getLang("categoryPrefixOnly")}\n${prefixOnly.length ? addBars(prefixOnly) : getLang("empty")}`,
        getLang("footer")
      ].join("\n");

      return message.reply(msg);
    }

    // Show command detail
    const name = args[0].toLowerCase();
    const cmd = commands.get(name) || commands.get(aliases.get(name));
    if (!cmd) return message.reply(getLang("notFound", name));

    const cfg = cmd.config;
    const getRole = (r) => ["Everyone", "Admin", "Bot Owner"][r] || `Role ${r}`;

    const msg = [
      getLang("detailTitle", cfg.name),
      "██████████—🌸",
      "",
      getLang("name", cfg.name || "N/A"),
      "",
      getLang("aliases", cfg.aliases?.join(", ") || "None"),
      "",
      getLang("description", typeof cfg.description === "object" ? cfg.description.en || "No description" : cfg.description || "No description"),
      "",
      getLang("role", getRole(cfg.role ?? 0)),
      "",
      getLang("guide", typeof cfg.guide === "object" ? (cfg.guide.en || getLang("noGuide")) : (cfg.guide || getLang("noGuide"))),
      "",
      getLang("version", cfg.version || "1.0"),
      "",
      "██████████—🌸"
    ].join("\n");

    return message.reply(msg);
  }
};
