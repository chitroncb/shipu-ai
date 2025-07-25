const font = {
 A: [
 " ██ ",
 " █ █ ",
 "███",
 "█ █",
 "█ █"
 ],
 B: [
 "██ ",
 "█ █",
 "██ ",
 "█ █",
 "██ "
 ],
 C: [
 " ██",
 "█ ",
 "█ ",
 "█ ",
 " ██"
 ],
 D: [
 "██ ",
 "█ █",
 "█ █",
 "█ █",
 "██ "
 ],
 E: [
 "███",
 "█ ",
 "██ ",
 "█ ",
 "███"
 ],
 F: [
 "███",
 "█ ",
 "██ ",
 "█ ",
 "█ "
 ],
 G: [
 " ███ ",
 "█ ",
 "█ ██",
 "█ █",
 " ███ "
 ],
 H: [
 "█ █",
 "█ █",
 "███",
 "█ █",
 "█ █"
 ],
 I: [
 "███",
 " █ ",
 " █ ",
 " █ ",
 "███"
 ],
 J: [
 " █",
 " █",
 " █",
 "█ █",
 " ██ "
 ],
 K: [
 "█ █",
 "█ █ ",
 "██ ",
 "█ █ ",
 "█ █"
 ],
 L: [
 "█ ",
 "█ ",
 "█ ",
 "█ ",
 "███"
 ],
 M: [
 "█ █ █ █",
 "█ █ █",
 "█ █",
 "█ █",
 "█ █"
 ],
 N: [
 "█ █",
 "██ █",
 "█ █ █",
 "█ █ █",
 "█ ██"
 ],
 O: [
 " ██ ",
 "█ █",
 "█ █",
 "█ █",
 " ██ "
 ],
 P: [
 "██ ",
 "█ █",
 "██ ",
 "█ ",
 "█ "
 ],
 Q: [
 " ██ ",
 "█ █",
 "█ █",
 "█ █ ",
 " ██ █"
 ],
 R: [
 "██ ",
 "█ █",
 "██ ",
 "█ █ ",
 "█ █"
 ],
 S: [
 " ██",
 "█ ",
 " ██ ",
 " █",
 "██ "
 ],
 T: [
 "███",
 " █ ",
 " █ ",
 " █ ",
 " █ "
 ],
 U: [
 "█ █",
 "█ █",
 "█ █",
 "█ █",
 " ██"
 ],
 V: [
 "█ █",
 "█ █",
 " █ █ ",
 " █ █ ",
 " █ "
 ],
 W: [
 "█ █",
 "█ █",
 "█ █",
 "█ █ █",
 " █ █ "
 ],
 X: [
 "█ █",
 " █ █ ",
 " ██ ",
 " █ █ ",
 "█ █"
 ],
 Y: [
 "█ █",
 "█ █",
 " ██ ",
 " █ ",
 " █ "
 ],
 Z: [
 "███",
 " █ ",
 " █ ",
 " █ ",
 "███"
 ],
 ' ': [
 " ",
 " ",
 " ",
 " ",
 " "
 ]
};

module.exports = {
 config: {
 name: "emojitext",
 version: "2.2",
 author: "Chitron Bhattacharjee",
 countDown: 3,
 role: 0,
 shortDescription: {
 en: "Emoji styled big A-Z text art"
 },
 description: {
 en: "Print big font art with emojis from A to Z"
 },
 category: "fun",
 guide: {
 en: "+emojitext yourtext 😘"
 }
 },

 onStart: async function ({ message, args }) {
 const emoji = args.slice(-1)[0];
 const inputText = args.slice(0, -1).join(" ").toUpperCase();

 if (!inputText || !emoji) return message.reply("⚠️ Usage: +emojitext yourtext 😘");

 let result = "▬▬▬▬▬▬▬▬▬▬▬▬♡︎├─❯\n𝐑𝐄𝐒𝐔𝐋𝐓:-\n\n.\n";

 for (const char of inputText) {
 const pattern = font[char] || font[" "];
 for (const line of pattern) {
 result += line.replace(/█/g, emoji).replace(/ /g, " ") + "\n";
 }
 result += "\n";
 }

 result += "\n♡︎▬▬▬▬▬▬▬▬▬▬▬▬";
 message.reply(result.trim());
 }
};