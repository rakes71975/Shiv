const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { PasteClient } = require('pastebin-api');

module.exports.config = {
    name: "adc",
    version: "1.0.0",
    permission: 2,
    credits: "Thjhn",
    description: "Update code from Pastebin or upload local file to Pastebin",
    category: "admin",
    usages: "[filename] or [reply to a pastebin link]",
    cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, type } = event;
    const fileName = args[0];

    // Case 1: Reply to a pastebin link to update local file
    if (type === "message_reply" && messageReply.body) {
        const text = messageReply.body;
        const urlR = /https?:\/\/pastebin\.com\/(raw\/)?([a-zA-Z0-9]+)/g;
        const match = text.match(urlR);

        if (match) {
            if (!fileName) return api.sendMessage('❌ Please provide a file name to save the code to (e.g., music).', threadID, messageID);
            
            let rawUrl = match[0];
            if (!rawUrl.includes('/raw/')) {
                const id = rawUrl.split('/').pop();
                rawUrl = `https://pastebin.com/raw/${id}`;
            }

            try {
                const response = await axios.get(rawUrl);
                const code = response.data;
                const filePath = path.join(__dirname, `${fileName}.js`);
                
                await fs.writeFile(filePath, code, 'utf-8');
                return api.sendMessage(`✅ Successfully updated code in ${fileName}.js`, threadID, messageID);
            } catch (error) {
                return api.sendMessage(`❌ Error fetching/writing code: ${error.message}`, threadID, messageID);
            }
        }
    }

    // Case 2: Upload local file to pastebin
    if (fileName && type !== "message_reply") {
        const filePath = path.join(__dirname, `${fileName}.js`);
        
        if (!fs.existsSync(filePath)) {
            return api.sendMessage(`❌ File ${fileName}.js does not exist in commands folder.`, threadID, messageID);
        }

        try {
            const data = await fs.readFile(filePath, "utf-8");
            const client = new PasteClient("P5FuV7J-UfXWFmF4lUTkJbGnbLBbLZJo");

            const url = await client.createPaste({
                code: data,
                expireDate: 'N',
                format: "javascript",
                name: fileName,
                publicity: 1
            });

            const rawLink = 'https://pastebin.com/raw/' + url.split('/').pop();
            return api.sendMessage(`✅ Uploaded ${fileName}.js to Pastebin:\n${rawLink}`, threadID, messageID);
        } catch (error) {
            return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
        }
    }

    return api.sendMessage('❌ Usage:\n1. Reply to a Pastebin link with: .adc [filename]\n2. Upload local file: .adc [filename]', threadID, messageID);
};
