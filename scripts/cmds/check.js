module.exports = {
  config: {
    name: "checkreact",
    version: "1.0",
    author: "Chitron Bhattacharjee", // ⛩️🍥💕
    countDown: 5,
    role: 0,
    shortDescription: { en: "React with 🤡 on 'check'" },
    longDescription: { en: "Reacts with clown emoji when someone types 'check'" },
    category: "fun",
    guide: { en: "No prefix needed. Just say 'check'" }
  },

  onStart: async function () {}, // dummy to satisfy install requirement

  onChat: async function ({ api, event }) {
    const content = event.body?.toLowerCase();
    if (content?.includes("check")) {
      return api.reaction("🤡", event.messageID);
    }
  }
};