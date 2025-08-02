const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const DIG = require("discord-image-generation");

module.exports = {
  config: {
    name: "gay",
    version: "1.0",
    author: "Vex_Kshitiz",
    shortDescription: "gays finder.",
    category: "fun",
    guide: "{p}gayfinder",
  },

  onStart: async function ({ api, event, usersData, message }) {
    const excludedUserID = "61557052662679";
    const threadInfo = await api.getThreadInfo(event.threadID);
        const participantIDs = threadInfo.participantIDs.filter(id => id !== event.senderID && id !== excludedUserID); 
        const randomIndex = Math.floor(Math.random() * participantIDs.length);
        const randomUserID = participantIDs[randomIndex];
        const userInfo = await api.getUserInfo([randomUserID]);
        const user = userInfo[randomUserID];
        const avatarUrl = await usersData.getAvatarUrl(randomUserID);

      
        const gayFilterImage = await applyGayFilter(avatarUrl);

        
        const imageAttachment = fs.createReadStream(gayFilterImage);
        message.reply({
          body: `Look i found a gay: ${user.name}`,
          attachment: imageAttachment,
        });
      },
    };

    async function applyGayFilter(avatarUrl) {
      const imageResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      const image = Buffer.from(imageResponse.data, "binary");
      const gayFilter = new DIG.Gay();
      const gayFilterImage = await gayFilter.getImage(image);

   
      const outputFile = path.join(__dirname, "cache", `gay.png`);
      fs.writeFileSync(outputFile, gayFilterImage);

      return outputFile;
    }
