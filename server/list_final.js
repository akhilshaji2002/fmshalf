const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
// Using REST directly to list models to confirm exact string
const https = require('https');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.models) {
                console.log("No models field:", json);
                return;
            }
            console.log("=== USABLE MODELS ===");
            json.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    // Extract just the name part after models/
                    console.log(m.name.replace('models/', ''));
                }
            });
            console.log("=====================");
        } catch (e) {
            console.error(e);
        }
    });
});
