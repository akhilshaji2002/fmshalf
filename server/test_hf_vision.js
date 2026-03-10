const fs = require('fs');

async function testHuggingFace() {
    try {
        console.log("Creating valid dummy image...");
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const buffer = Buffer.from(base64Image, 'base64');
        
        console.log("Fetching BLIP model...");
        const res = await fetch(
            "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                },
                body: buffer
            }
        );
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testHuggingFace();
