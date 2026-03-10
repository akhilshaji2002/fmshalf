const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    try {
        console.log("Testing gemini-1.5-flash-latest...");
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        // create dummy image file
        fs.writeFileSync('dummy.jpg', Buffer.alloc(100));
        
        const filePart = {
            inlineData: {
                data: fs.readFileSync('dummy.jpg').toString("base64"),
                mimeType: 'image/jpeg'
            },
        };
        
        const result = await visionModel.generateContent(["describe this", filePart]);
        console.log(result.response.text());
        fs.unlinkSync('dummy.jpg');
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
