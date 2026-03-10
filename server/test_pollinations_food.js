const fs = require('fs');

async function test() {
    try {
        const imagePath = 'dummy_food.jpg';
        const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const mimeType = "image/png";

        const prompt = `Act as an Advanced AI Clinical Nutritionist and Vision Specialist. 
        Analyze the uploaded food image.

        1. Identify all food components and estimate portions.
        2. Calculate: Calories, Protein (g), Net Carbs (g), Fats (g), and Fiber (g).
        3. Assign a "Health Grade": 
           - [Excellent]: High protein, complex carbs, micronutrient dense.
           - [Great]: Balanced macros, low processed sugar.
           - [Average]: High calorie but moderate nutrition.
           - [Poor]: High trans-fats, refined sugars, or extreme calorie density.
        4. Coach Insight: MAX 1 sentence technical critique (e.g., "Sodium heavy; increase water.").

        RETURN JSON ONLY:
        {
          "meal_analysis": {
            "items_detected": ["Grilled Chicken 150g", "Rice 100g"],
            "macros": { "calories": 450, "protein": 40, "carbs": 50, "fats": 10, "fiber": 5 },
            "health_grade": "Excellent",
            "coach_note": "Great post-workout meal due to high lean protein."
          }
        }`;

        const payload = {
            model: "openai",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
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
        console.log("Raw Text:", text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log("Parsed JSON:", JSON.parse(jsonMatch[0]));
        } else {
            console.log("Regex failed to find JSON");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
