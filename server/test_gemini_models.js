const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        console.log(`✅ Success with ${modelName}`);
        return true;
    } catch (error) {
        console.log(`❌ Failed with ${modelName}: ${error.message}`);
        return false;
    }
}

async function run() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro-vision'];

    for (const m of models) {
        if (await testModel(m)) break;
    }
}

run();
