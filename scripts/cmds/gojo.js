const {get} = require("axios"),
    url = "http://eu4.diresnode.com:3301";

module.exports = {
  config: {
    name: "gojo",
    aliases: ["jjk"],
    version: "1.0.0",
    author: "Deku",
    countDown: 0,
    role: 0,
    shortDescription: {
      en: "Talk to GOJO AI (continues conversation)",
    },
    longDescription: {
      en: "Talk to GOJO AI (continues conversation)",
    },
    category: "AI",
    guide: {
      en: "gojo <ask> or gojo <clear> to reset conversation."
    },
  },

  onStart: async function ({ api, event, args }) {
    try {
     let prompt = args.join(' '), id = event.senderID;
           async function r(msg){
                 api.sendMessage(msg, event.threadID, event.messageID)
             }
            if(!prompt) return r("Missing input!\n\nIf you want to reset the conversation with "+this.config.name+" you can use “"+this.config.name+" clear”");
            r("🔍…");
            const res = await get(url+"/gojo_gpt?prompt="+prompt+"&idd="+id);
                return r(res.data.gojo);
       } catch (error) {
      console.error("Error:", error);
      return api.sendMessage(error.message, event.threadID, event.messageID)
     }
   }
};