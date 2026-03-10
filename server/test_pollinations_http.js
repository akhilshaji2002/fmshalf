async function test() {
    try {
        const payload = {
            model: "openai",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is this?" },
                        { type: "image_url", image_url: { url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/June_odd-eyed-cat.jpg" } }
                    ]
                }
            ]
        };

        const aiResponse = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await aiResponse.text();
        console.log("Status:", aiResponse.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
