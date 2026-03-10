require('dotenv').config({ path: './.env' });
const fs = require('fs');

async function fetchModels() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        fs.writeFileSync('api_response_models.json', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
fetchModels();
