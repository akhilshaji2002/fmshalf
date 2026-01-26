const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { console.log("No Key"); return; }

    const genAI = new GoogleGenerativeAI(key);
    // Prioritize Flash (fastest), then Pro (best), then Vision (legacy)
    // Standard models
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    for (const name of modelNames) {
        console.log(`Testing model: ${name}...`);
        try {
            const model = genAI.getGenerativeModel({ model: name });
            // Simple text generation proof of life
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${name} is working!`);
            process.exit(0); // Exit with success
        } catch (e) {
            console.log(`❌ FAIL: ${name} - ${e.message.split(']')[1] || e.message}`);
        }
    }
    console.log("No working models found.");
}
run();
