const fs = require('fs');

async function testPollinationsVision() {
    try {
        console.log("Creating dummy image...");
        // A valid 1x1 black pixel PNG:
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const dataUrl = `data:image/png;base64,${base64Image}`;

        const payload = {
            model: "openai",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is in this image? Just answer briefly." },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ]
        };

        console.log("Fetching from text.pollinations.ai...");
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.text();
        console.log("Status:", response.status);
        try {
            console.log("Response:", JSON.stringify(JSON.parse(data), null, 2));
        } catch {
            console.log("Response:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testPollinationsVision();
