module.exports = {
  config: {
    name: "ludo",
    version: "1.1",
    author: "Chitron Bhattacharjee 🐐✨",
    shortDescription: { en: "🎲 Play a Ludo-style dice game with friends!" },
    longDescription: { en: "🎮 Challenge a friend: roll dice, race to 30 points, first wins!" },
    category: "Fun & Game",
    cooldown: 5,
  },

  langs: {
    en: {
      start_game:
        "🎲 Ludo Dice Game Started!\n🌟 %1 vs %2\n🌀 Type `roll` to throw the dice!",
      not_enough_players: "⚠️ Please mention one friend to play Ludo!",
      not_your_turn: "⛔ It's not your turn!",
      rolled: "🎲 %1 rolled a %2! (Total: %3)",
      win: "🏁 Congrats %1, you win this Ludo race!",
      game_already_running: "⚠️ A game is already running in this chat!",
      no_game_running: "❌ No active Ludo game in this chat.",
      game_cancelled: "🚫 Ludo game cancelled by %1.",
      only_players: "🚫 Only %1 or %2 can play this game.",
      current_turn: "🔄 It's %1's turn! Type `roll` to play.",
      invalid_command: "❓ Unknown command! Use `roll` or `cancel`.",
    },
  },

  games: {},

  locks: {},

  onStart: async function ({ args, message, event, getLang }) {
    const { mentions, threadID, senderID } = event;

    if (this.games[threadID]) {
      return message.reply(getLang("game_already_running"));
    }

    const opponentID = Object.keys(mentions || {})[0];
    if (!opponentID || opponentID === senderID) {
      return message.reply(getLang("not_enough_players"));
    }

    this.games[threadID] = {
      players: [senderID, opponentID],
      scores: { [senderID]: 0, [opponentID]: 0 },
      turn: senderID,
    };

    const name1 = (await global.usersData.get(senderID))?.name || "Player 1";
    const name2 = (await global.usersData.get(opponentID))?.name || "Player 2";

    return message.reply(getLang("start_game", name1, name2));
  },

  onMessage: async function ({ message, event, getLang }) {
    const { body, senderID, threadID } = event;
    const game = this.games[threadID];
    if (!game) return;

    if (this.locks[threadID]) return;
    this.locks[threadID] = true;

    const cmd = body.trim().toLowerCase();

    const [p1, p2] = game.players;
    const name1 = (await global.usersData.get(p1))?.name || "Player 1";
    const name2 = (await global.usersData.get(p2))?.name || "Player 2";

    if (cmd === "roll") {
      if (!game.players.includes(senderID)) {
        this.locks[threadID] = false;
        return message.reply(getLang("only_players", name1, name2));
      }

      if (senderID !== game.turn) {
        this.locks[threadID] = false;
        return message.reply(getLang("not_your_turn"));
      }

      const roll = Math.floor(Math.random() * 6) + 1;
      game.scores[senderID] += roll;

      const playerName = senderID === p1 ? name1 : name2;

      await message.reply(getLang("rolled", playerName, roll, game.scores[senderID]));

      if (game.scores[senderID] >= 30) {
        delete this.games[threadID];
        this.locks[threadID] = false;
        return message.reply(getLang("win", playerName));
      }

      game.turn = game.players.find((id) => id !== senderID);

      const nextName = game.turn === p1 ? name1 : name2;
      await message.reply(getLang("current_turn", nextName));

      this.locks[threadID] = false;
      return;
    }

    if (cmd === "cancel") {
      if (!game.players.includes(senderID)) {
        this.locks[threadID] = false;
        return message.reply("🚫 Only game players can cancel this game.");
      }
      delete this.games[threadID];
      this.locks[threadID] = false;
      return message.reply(getLang("game_cancelled", senderID === p1 ? name1 : name2));
    }

    this.locks[threadID] = false;
    if (game) {
      await message.reply(getLang("invalid_command"));
    }
  },
};