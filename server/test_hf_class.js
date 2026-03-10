const fs = require('fs');

async function testHFClassification() {
    try {
        console.log("Fetching image to test...");
        const imgRes = await fetch("https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg");
        const blob = await imgRes.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());

        console.log("Sending to Hugging Face...");
        const res = await fetch(
            "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
            {
                method: "POST",
                headers: { "Content-Type": "application/octet-stream" },
                body: buffer
            }
        );
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response Text:", text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
testHFClassification();
