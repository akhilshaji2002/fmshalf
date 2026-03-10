const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
    console.log("Testing Imagen 3 API with raw REST...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;
    
    const payload = {
        instances: [
            { prompt: "A highly muscular fitness model, dramatic lighting." }
        ],
        parameters: {
            sampleCount: 1,
            outputOptions: { mimeType: "image/jpeg" }
        }
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.predictions && data.predictions.length > 0) {
            console.log("Success! Image generated.");
            const base64 = data.predictions[0].bytesBase64Encoded;
            require('fs').writeFileSync('test_imagen.jpg', Buffer.from(base64, 'base64'));
            console.log("Saved test_imagen.jpg");
        } else {
            console.log("Failed:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
