const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
// Initialize SDK
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Keep Gemini for text metrics if possible, or fallback
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

const User = require('../models/User');

// POST /api/ai/calculate
exports.calculateHealthMetrics = async (req, res) => {
    try {
        let { age, weight, height, gender, activityLevel, goals, userId } = req.body;

        // 1. Input Normalization & Validation
        age = parseFloat(age) || 25;
        weight = parseFloat(weight) || 70;
        height = parseFloat(height) || 170;
        gender = (gender || 'male').toLowerCase();
        activityLevel = (activityLevel || 'moderate').toLowerCase();

        if (weight <= 0 || height <= 0) {
            throw new Error("Invalid weight or height");
        }

        if (!model) {
            console.warn("⚠️ Gemini AI not initialized. Using fallback formulas only.");
            // We can proceed to fallback immediately or throw if strictly AI is required.
            // Let's proceed to fallback to ensure user gets data.
        }

        let aiData = {};
        let aiSuccess = false;

        if (model) {
            try {
                const prompt = `Act as an expert nutritionist and fitness trainer. Analyze this profile:
                - Age: ${age}
                - Weight: ${weight}kg
                - Height: ${height}cm
                - Gender: ${gender}
                - Activity: ${activityLevel}
                - Goal: ${goals || 'Fitness'}

                Provide these exact metrics:
                1. BMR (Basal Metabolic Rate)
                2. TDEE (Total Daily Energy Expenditure)
                3. Macro Split (Protein, Fats, Carbs in grams)
                4. One sentence Diet Advice
                5. One sentence Workout Advice

                IMPORTANT: Return ONLY valid JSON. No markdown formatting.
                Expected JSON Format:
                {
                    "bmr": 1500,
                    "tdee": 2200,
                    "macros": { "protein": 150, "fats": 70, "carbs": 200 },
                    "dietAdvice": "Eat more whole foods.",
                    "workoutAdvice": "Focus on compound lifts."
                }`;

                const result = await model.generateContent(prompt);
                const text = result.response.text();

                // 2. Robust JSON Extraction
                // Find { ... } pattern, mostly greedy to capture nested objects
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiData = JSON.parse(jsonMatch[0]);
                    aiSuccess = true;
                }
            } catch (aiError) {
                console.error("❌ AI Generation/Parse Failed:", aiError.message);
                // Continue to fallback
            }
        }

        // 3. Helper to safe-parse numbers (handles "1,500", "200g", etc.)
        const safeNum = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const clean = val.replace(/[^0-9.]/g, ''); // Remove 'g', 'kcal', ','
                return parseFloat(clean) || 0;
            }
            return 0;
        };

        // 4. Extract & Sanitize AI Data
        let bmr = safeNum(aiData.bmr || aiData.BMR);
        let tdee = safeNum(aiData.tdee || aiData.TDEE);
        let rawMacros = aiData.macros || aiData.Macros || {};
        let macros = {
            protein: safeNum(rawMacros.protein || rawMacros.Protein),
            fats: safeNum(rawMacros.fats || rawMacros.Fats || rawMacros.fat),
            carbs: safeNum(rawMacros.carbs || rawMacros.Carbs || rawMacros.carb)
        };

        // 5. Fallback Calculations (The "Basis of AI" is augmented by Math if AI fails or returns 0)
        // Harris-Benedict Equation
        if (!bmr || bmr < 500) {
            console.log("ℹ️ Using Formula for BMR");
            if (gender === 'female') {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            } else {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            }
            bmr = Math.round(bmr);
        }

        if (!tdee || tdee < 500) {
            console.log("ℹ️ Using Formula for TDEE");
            const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
            const mult = multipliers[activityLevel] || 1.2;
            tdee = Math.round(bmr * mult);
        }

        // Standard Ratios if macros missing (30P/35F/35C)
        if (!macros.protein || !macros.fats || !macros.carbs) {
            console.log("ℹ️ Using Formula for Macros");
            macros.protein = Math.round((tdee * 0.30) / 4);
            macros.fats = Math.round((tdee * 0.35) / 9);
            macros.carbs = Math.round((tdee * 0.35) / 4);
        }

        // 6. Response Construction
        const finalData = {
            saved: false,
            // Numbers for UI
            tdee: tdee,
            bmr: bmr,
            dietPlan: {
                calories: tdee,
                macros: macros,
                suggestion: aiData.dietAdvice || aiData.diet_advice || "Focus on hitting your daily protein target.",
                generatedAt: new Date()
            }
        };

        // 7. Save to Database
        if (userId) {
            const userDoc = await User.findById(userId);
            if (userDoc) {
                userDoc.metrics = {
                    ...userDoc.metrics,
                    age, weight, height, gender, activityLevel,
                    bmr, tdee
                };
                userDoc.dietPlan = finalData.dietPlan;
                await userDoc.save();
                finalData.saved = true;
                console.log(`✅ Plan Saved for user ${userId} (Source: ${aiSuccess ? 'AI' : 'Formula'})`);
            }
        }

        res.json(finalData);

    } catch (err) {
        console.error('SERVER ERROR in calculate:', err);
        res.status(500).json({ message: "Calculation failed", error: err.message });
    }
};

// POST /api/ai/progress
exports.generateProgressImage = async (req, res) => {
    console.log("🚀 Starting Pollinations Generation...");
    try {
        const { months, workoutType, bodyFat, calorieGoal, age, gender, weight, height, daysOfWorkout } = req.body;
        const imageFile = req.file;

        // 1. Construct a detailed prompt for Pollinations
        const prompt = `fitness transformation, ${gender}, ${age} years old, ${weight}kg, ${height}cm tall, extremely fit and muscular physique after ${months} months of ${workoutType} training, ${bodyFat}% body fat, ripped abs, vascular, gym lighting, realistic photo, 8k, highly detailed`;

        console.log(`📝 Prompt: ${prompt}`);

        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 1000000);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux`;

        // 2. Prepare file path
        const filename = `generated_${req.user._id}_${Date.now()}.jpg`;
        const generatedPath = path.join(__dirname, '..', 'uploads', 'generated', filename);

        const generatedDir = path.dirname(generatedPath);
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }

        // 3. Fetch the image from Pollinations
        console.log(`🌍 Fetching URL: ${pollinationsUrl}`);
        const response = await fetch(pollinationsUrl);

        if (!response.ok) {
            throw new Error(`Pollinations API failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Save to disk
        fs.writeFileSync(generatedPath, buffer);
        const savedImageUrl = `/uploads/generated/${filename}`;
        console.log(`✅ Saved to: ${savedImageUrl}`);

        // 5. Add to history
        req.user.generatedImages.push({
            imageUrl: savedImageUrl,
            prompt: `Goal: ${months} months of ${workoutType} (Pollinations)`
        });
        await req.user.save();

        // 6. Cleanup uploaded source file
        if (imageFile && fs.existsSync(imageFile.path)) {
            fs.unlinkSync(imageFile.path);
        }

        // 7. Return result
        res.json({
            image: savedImageUrl,
            isDemo: false,
            message: "Generated successfully via Pollinations"
        });

    } catch (err) {
        console.error('❌ Image generation error:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: err.message });
    }
};
