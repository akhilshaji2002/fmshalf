const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

let outputLog = "";
function log(msg) {
    console.log(msg);
    outputLog += msg + '\n';
}

async function testModel(modelName) {
    try {
        log(`Testing ${modelName}...`);
        const visionModel = genAI.getGenerativeModel({ model: modelName });
        
        fs.writeFileSync('dummy.jpg', Buffer.alloc(100));
        const filePart = { inlineData: { data: fs.readFileSync('dummy.jpg').toString("base64"), mimeType: 'image/jpeg' } };
        
        const result = await visionModel.generateContent(["describe this", filePart]);
        log(`✅ Success with ${modelName}`);
        return true;
    } catch (e) {
        log(`❌ Failed ${modelName} - ${e.status}: ${e.message}`);
        return false;
    } finally {
        if (fs.existsSync('dummy.jpg')) fs.unlinkSync('dummy.jpg');
    }
}

async function runTests() {
    const models = [
        "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash-8b", 
        "gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.0-pro-vision-latest"
    ];
    for (const m of models) { await testModel(m); }
    fs.writeFileSync('test_output.txt', outputLog);
}

runTests();
