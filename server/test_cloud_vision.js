require('dotenv').config({ path: './.env' });
const fs = require('fs');

async function testCloudVision() {
    try {
        console.log("Fetching dummy pizza image...");
        const imgRes = await fetch("https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg");
        const blob = await imgRes.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64Img = buffer.toString('base64');

        const payload = {
            requests: [
                {
                    image: { content: base64Img },
                    features: [ { type: "LABEL_DETECTION", maxResults: 10 } ]
                }
            ]
        };

        console.log("Calling vision.googleapis.com...");
        const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testCloudVision();
