const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const key = process.env.GEMINI_API_KEY;

if (!key) {
    console.error("Error: GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log(`Querying: ${url.replace(key, 'HIDDEN_KEY')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("✅ Available Models:");
                json.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
            } else {
                console.log("❌ Error response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Failed to parse response:", data);
        }
    });
}).on('error', (err) => {
    console.error('Network Error:', err.message);
});
