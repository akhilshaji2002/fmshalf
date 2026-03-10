const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './server/.env' });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Checking API Key:", apiKey ? "Present" : "Missing");

    if (!apiKey) return;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log("🚀 Sending simple text prompt to Gemini...");
        const result = await model.generateContent("Hello, are you online?");
        const response = await result.response;
        const text = response.text();

        console.log("✅ Success! Gemini replied:", text);
    } catch (error) {
        console.error("❌ Gemini API Error:", error.message);
    }
}

testGemini();
