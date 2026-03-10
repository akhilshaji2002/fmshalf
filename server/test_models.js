require('dotenv').config({ path: './.env' });
const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        const models = data.models.map(m => m.name);
        console.log("Available models:", models.filter(m => m.includes('gemini')));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
