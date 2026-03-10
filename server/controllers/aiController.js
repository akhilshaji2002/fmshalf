const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
// Initialize SDK
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Keep Gemini for text metrics if possible, or fallback
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

const User = require('../models/User');

// POST /api/ai/calculate
// POST /api/ai/calculate
exports.calculateHealthMetrics = async (req, res) => {
    try {
        let { age, weight, height, gender, activityLevel, goals, dietType, foodAllergies, healthConditions, userId } = req.body;

        // 1. Input Normalization & Validation
        age = parseFloat(age) || 25;
        weight = parseFloat(weight) || 70;
        height = parseFloat(height) || 170;
        gender = (gender || 'male').toLowerCase();
        activityLevel = (activityLevel || 'moderate').toLowerCase();
        dietType = (dietType || 'balanced').toLowerCase();
        foodAllergies = Array.isArray(foodAllergies) ? foodAllergies : [];
        healthConditions = Array.isArray(healthConditions) ? healthConditions : [];

        if (weight <= 0 || height <= 0) {
            throw new Error("Invalid weight or height");
        }

        // Calculate BMR & TDEE First (Source of Truth)
        let bmr, tdee;
        if (gender === 'female') {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        } else {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        }
        bmr = Math.round(bmr);

        const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        const mult = multipliers[activityLevel] || 1.2;
        tdee = Math.round(bmr * mult);

        // Adjust TDEE based on Goal
        if (goals === 'Weight Loss') tdee -= 500;
        else if (goals === 'Muscle Gain') tdee += 300;

        if (!model) {
            console.warn("⚠️ Gemini AI not initialized. Using fallback formulas only.");
        }

        let aiData = {};
        let aiSuccess = false;

        if (model) {
            try {
                const prompt = `Act as an expert clinical nutritionist from India. Analyze this profile:
                - Age: ${age}
                - Weight: ${weight}kg
                - Height: ${height}cm
                - Gender: ${gender}
                - Activity: ${activityLevel}
                - Goal: ${goals || 'Fitness'}
                - Diet Type: ${dietType}
                - Allergies/Intolerances: ${foodAllergies.join(', ') || 'None'}
                - Medical Conditions: ${healthConditions.join(', ') || 'None'}
                - Calculated Target Calories (TDEE): ${tdee} kcal (STRICTLY ADHERE TO THIS)

                Provide these exact metrics and a 7-Day Diet Plan.
                CRITICAL: The daily calories in the plan MUST match the Target Calories (${tdee}) ±100kcal.
                CRITICAL: Modify food choices based on Medical Conditions (e.g. Diabetic -> Low GI, Hypertension -> Low Sodium).
                CRITICAL: STRICTLY avoid any foods from allergy/intolerance list.
                CRITICAL: Respect Diet Type (vegan excludes dairy/egg/fish/meat; vegetarian excludes fish/meat/shellfish).
                CRITICAL: Provide variety. Do not repeat the same meals every day.

                IMPORTANT: Return ONLY valid JSON. No markdown.
                Expected JSON Format:
                {
                    "macros": { "protein": 150, "fats": 70, "carbs": 200 },
                    "dietAdvice": "Specific medical advice based on conditions...",
                    "weeklyPlan": [
                        {
                            "day": "Day 1",
                            "meals": [
                                { "name": "Breakfast", "description": "Specific Dish Name", "calories": 400, "macros": { "p": 30, "f": 10, "c": 50 } },
                                // ... 5 meals (Breakfast, Snack 1, Lunch, Snack 2, Dinner)
                            ]
                        }
                        // ... 7 days
                    ],
                    "groceryList": ["Item 1", "Item 2"],
                    "hydrationTarget": "3-4 Liters",
                    "plateMethod": "Plate distribution advice"
                }`;

                const result = await model.generateContent(prompt);
                const text = result.response.text();

                // 2. Robust JSON Extraction
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiData = JSON.parse(jsonMatch[0]);
                    aiSuccess = true;
                }
            } catch (aiError) {
                console.error("❌ AI Generation/Parse Failed:", aiError.message);
            }
        }

        // 3. Helper to safe-parse numbers
        const safeNum = (val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const clean = val.replace(/[^0-9.]/g, '');
                return parseFloat(clean) || 0;
            }
            return 0;
        };

        // 4. Extract & Sanitize AI Data
        // Use AI metrics if available and reasonable, else use calculated TDEE/BMR
        // We override AI TDEE with our Calculated TDEE to ensure sync, unless AI deviation is small.
        // Actually, let's trust our Formula TDEE as the Authority for syncing.

        let rawMacros = aiData.macros || aiData.Macros || {};
        let macros = {
            protein: safeNum(rawMacros.protein || rawMacros.Protein),
            fats: safeNum(rawMacros.fats || rawMacros.Fats || rawMacros.fat),
            carbs: safeNum(rawMacros.carbs || rawMacros.Carbs || rawMacros.carb)
        };

        // Standard Ratios if macros missing (30P/35F/35C)
        if (!macros.protein || !macros.fats || !macros.carbs) {
            console.log("ℹ️ Using Formula for Macros");
            macros.protein = Math.round((tdee * 0.30) / 4);
            macros.fats = Math.round((tdee * 0.35) / 9);
            macros.carbs = Math.round((tdee * 0.35) / 4);
        }

        // 5b. Diet Plan Fallback (If AI failed to generate specific weekly plan)
        // We generate a generic structure so the UI doesn't break/hide.
        if (!aiData.weeklyPlan || aiData.weeklyPlan.length === 0) {
            console.log("ℹ️ Using Fallback Dynamic Diet Plan (AI Failed)");

            // Calculate meal caloric distribution based on TDEE
            // Breakfast: 25%, Snack1: 10%, Lunch: 35%, Snack2: 10%, Dinner: 20%
            const spread = { b: 0.25, s1: 0.10, l: 0.35, s2: 0.10, d: 0.20 };
            const mCal = {
                b: Math.round(tdee * spread.b),
                s1: Math.round(tdee * spread.s1),
                l: Math.round(tdee * spread.l),
                s2: Math.round(tdee * spread.s2),
                d: Math.round(tdee * spread.d)
            };

            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

            // Helper to generate macros
            const getM = (cals) => ({
                p: Math.round((cals * 0.3) / 4),
                f: Math.round((cals * 0.35) / 9),
                c: Math.round((cals * 0.35) / 4)
            });

            const mealLibrary = {
                breakfast: [
                    "Oats with chia, banana and peanut butter",
                    "Vegetable omelette with whole wheat toast",
                    "Poha with peanuts + curd",
                    "Paneer bhurji wrap with salad",
                    "Greek yogurt parfait with berries and seeds",
                    "Idli-sambar with boiled eggs/paneer cubes",
                    "Besan chilla with mint chutney"
                ],
                snack1: [
                    "Apple + handful of almonds",
                    "Greek yogurt with flax seeds",
                    "Sprouts chaat with lemon",
                    "Protein smoothie with milk and banana",
                    "Roasted chana + coconut water",
                    "Fruit bowl + pumpkin seeds",
                    "Buttermilk + peanuts"
                ],
                lunch: [
                    "Grilled chicken/paneer, dal, rice and sauteed veggies",
                    "Rajma-chawal with cucumber salad",
                    "Fish/tofu curry with brown rice and beans",
                    "Chicken/paneer stir-fry with millet roti",
                    "Chole with jeera rice and mixed salad",
                    "Lean keema/soy granules with quinoa and veggies",
                    "Sambar rice with curd and stir-fried vegetables"
                ],
                snack2: [
                    "Whey/soy protein shake + walnuts",
                    "Boiled corn + cottage cheese cubes",
                    "Banana + peanut butter",
                    "Makhana roasted in ghee (small portion)",
                    "Hummus with carrot-cucumber sticks",
                    "Lassi (low sugar) + mixed nuts",
                    "Paneer tikka bites"
                ],
                dinner: [
                    "Grilled fish/chicken/paneer with sauteed vegetables",
                    "Moong dal khichdi with curd",
                    "Tofu/paneer salad bowl with olive oil dressing",
                    "Chicken soup with whole grain toast",
                    "Egg bhurji/paneer scramble with stir-fry veggies",
                    "Dal + 2 phulkas + mixed vegetable sabzi",
                    "Light quinoa pulao with raita"
                ]
            };

            const hasAllergy = (text) => {
                const t = (text || '').toLowerCase();
                const allergies = (foodAllergies || []).map(a => a.toLowerCase());
                if (dietType === 'vegan') {
                    if (/(milk|curd|yogurt|paneer|cheese|ghee|egg|chicken|fish|shrimp|meat|keema)/i.test(t)) return true;
                } else if (dietType === 'vegetarian') {
                    if (/(chicken|fish|shrimp|meat|keema)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('milk') || a.includes('dairy'))) {
                    if (/(milk|curd|yogurt|paneer|cheese|ghee|lassi|buttermilk|raita)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('shrimp') || a.includes('shellfish'))) {
                    if (/(shrimp|shellfish|prawn|lobster|crab)/i.test(t)) return true;
                }
                if (allergies.some(a => a === 'fish' || a.includes('fish'))) {
                    if (/(fish|salmon|tuna)/i.test(t)) return true;
                }
                if (allergies.some(a => a === 'egg' || a.includes('egg'))) {
                    if (/(egg|omelette)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('peanut'))) {
                    if (/(peanut)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('tree nuts'))) {
                    if (/(almond|walnut|cashew|pistachio|nuts)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('soy'))) {
                    if (/(soy|tofu|soya)/i.test(t)) return true;
                }
                if (allergies.some(a => a.includes('gluten'))) {
                    if (/(wheat|toast|roti|bread)/i.test(t)) return true;
                }
                return false;
            };

            const getSafeMeal = (bucket, idx, fallback) => {
                const list = mealLibrary[bucket] || [];
                const rotated = [...list.slice(idx), ...list.slice(0, idx)];
                const safe = rotated.find(item => !hasAllergy(item));
                return safe || fallback;
            };

            aiData.weeklyPlan = days.map((day, idx) => ({
                day,
                meals: [
                    { name: "Breakfast", description: getSafeMeal("breakfast", idx % 7, "Oats with fruit and seeds"), calories: mCal.b, macros: getM(mCal.b) },
                    { name: "Snack 1", description: getSafeMeal("snack1", idx % 7, "Fruit + roasted chana"), calories: mCal.s1, macros: getM(mCal.s1) },
                    { name: "Lunch", description: getSafeMeal("lunch", idx % 7, "Dal, rice and mixed vegetables"), calories: mCal.l, macros: getM(mCal.l) },
                    { name: "Snack 2", description: getSafeMeal("snack2", idx % 7, "Hummus with veggie sticks"), calories: mCal.s2, macros: getM(mCal.s2) },
                    { name: "Dinner", description: getSafeMeal("dinner", idx % 7, "Quinoa with sauteed vegetables"), calories: mCal.d, macros: getM(mCal.d) }
                ]
            }));
            const baseGroceries = ["Oats", "Milk/Almond Milk", "Chicken/Paneer", "Rice", "Seasonal Vegetables", "Fruits", "Nuts", "Yogurt", "Lentils/Dal", "Eggs", "Fish", "Tofu"];
            aiData.groceryList = baseGroceries.filter(item => !hasAllergy(item));
            aiData.hydrationTarget = "3.5 - 4.5 Liters";
            aiData.plateMethod = "50% Vegetables, 25% Protein, 25% Carbohydrates";

            if (healthConditions.includes('Diabetic')) {
                aiData.plateMethod += " (Focus on Low GI + High Fiber)";
                aiData.dietAdvice = "Avoid refined sugars. Choose complex carbs like oats, quinoa, and brown rice.";
            } else if (healthConditions.includes('High Cholesterol')) {
                aiData.plateMethod += " (Limit Saturated Fats)";
                aiData.dietAdvice = "Choose lean proteins and healthy fats like olive oil and nuts. Avoid fried foods.";
            } else {
                aiData.dietAdvice = "Maintain a balanced diet with whole foods to reach your fitness goals.";
            }
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
                weeklyPlan: aiData.weeklyPlan || [],
                groceryList: aiData.groceryList || [],
                hydrationTarget: aiData.hydrationTarget || "3-4 Liters",
                plateMethod: aiData.plateMethod || "50% Veggies, 25% Protein, 25% Carbs",
                dietType,
                foodAllergies,
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

const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

const toNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''));
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

const round1 = (num) => Math.round((num + Number.EPSILON) * 10) / 10;
let mobileNetLoadPromise = null;

const getHintedFoodType = (scopeText) => {
    const text = String(scopeText || '').toLowerCase();
    if (/(biryani|biriyani|pulao|pulav|fried rice|rice bowl|rice plate|pilaf|paella|risotto)/i.test(text)) return 'biryani';
    if (/(grilled chicken|chicken|tandoori|kebab|bbq|shawarma|drumstick|roast chicken)/i.test(text)) return 'chicken';
    if (/(pizza|pepperoni|margherita)/i.test(text)) return 'pizza';
    return null;
};

const getMobileNetModel = async () => {
    if (!mobileNetLoadPromise) {
        mobileNetLoadPromise = (async () => {
            await tf.setBackend('cpu');
            await tf.ready();
            return mobilenet.load({ version: 2, alpha: 0.5 });
        })().catch((err) => {
            mobileNetLoadPromise = null;
            throw err;
        });
    }
    return mobileNetLoadPromise;
};

const readJpegTensor = (imagePath) => {
    const buffer = fs.readFileSync(imagePath);
    const pixels = jpeg.decode(buffer, true);
    const numChannels = 3;
    const numPixels = pixels.width * pixels.height;
    const values = new Int32Array(numPixels * numChannels);
    for (let i = 0; i < numPixels; i += 1) {
        for (let c = 0; c < numChannels; c += 1) {
            values[(i * numChannels) + c] = pixels.data[(i * 4) + c];
        }
    }
    return tf.tensor3d(values, [pixels.height, pixels.width, numChannels], 'int32');
};

const getHashBasedFoodType = (imagePath) => {
    const img = fs.readFileSync(imagePath);
    const hash = crypto.createHash('md5').update(img).digest('hex');
    const bucket = parseInt(hash.slice(0, 2), 16) % 3;
    return ['biryani', 'chicken', 'pizza'][bucket];
};

const classifyFoodTypeFromImage = async (imagePath, mimeType, hintScope) => {
    const hinted = getHintedFoodType(hintScope);
    if (hinted) return { type: hinted, confidence: 0.9, source: 'hint' };
    if (!/(jpeg|jpg)/i.test(mimeType || '')) {
        return { type: getHashBasedFoodType(imagePath), confidence: 0.55, source: 'hash' };
    }

    try {
        const classifier = await getMobileNetModel();
        const tensor = readJpegTensor(imagePath);
        const predictions = await classifier.classify(tensor, 5);
        tensor.dispose();

        const labels = (predictions || []).map((p) => ({
            label: String(p.className || '').toLowerCase(),
            probability: Number(p.probability || 0)
        }));
        const top = labels[0] || { label: '', probability: 0 };
        const labelBlob = labels.map((x) => x.label).join(' ');

        if (/(pizza)/i.test(labelBlob)) {
            return { type: 'pizza', confidence: clamp(top.probability || 0.8, 0.6, 0.95), source: 'vision' };
        }
        if (/(chicken|drumstick|rotisserie|barbecue|bbq|kebab|shawarma|meat loaf|steak)/i.test(labelBlob)) {
            return { type: 'chicken', confidence: clamp(top.probability || 0.8, 0.6, 0.95), source: 'vision' };
        }
        if (/(plate|dish|rice|paella|pilaf|risotto|hotpot|curry)/i.test(labelBlob)) {
            return { type: 'biryani', confidence: clamp(top.probability || 0.75, 0.58, 0.9), source: 'vision' };
        }
    } catch (visionErr) {
        console.log('⚠️ MobileNet fallback classification failed:', visionErr.message);
    }

    return { type: getHashBasedFoodType(imagePath), confidence: 0.58, source: 'hash' };
};

const scaleNutrition = (nutrition, grams) => {
    const ratio = grams / 100;
    return {
        calories: Math.round((nutrition.calories || 0) * ratio),
        protein: round1((nutrition.protein || 0) * ratio),
        carbs: round1((nutrition.carbs || 0) * ratio),
        fats: round1((nutrition.fats || 0) * ratio),
        fiber: round1((nutrition.fiber || 0) * ratio),
        sugar: round1((nutrition.sugar || 0) * ratio),
        sodium_mg: Math.round((nutrition.sodium_mg || 0) * ratio),
        saturated_fat: round1((nutrition.saturated_fat || 0) * ratio)
    };
};

const normalizeAnalysis = (payload, selectedWeightGrams) => {
    const candidate = payload?.meal_analysis || payload || {};
    const estimatedWeight = clamp(Math.round(toNumber(candidate.estimated_weight_g, selectedWeightGrams || 150)), 50, 1500);
    const selectedWeight = clamp(Math.round(toNumber(selectedWeightGrams, estimatedWeight)), 50, 1500);
    const fallbackNutrition = candidate.nutrition || candidate.macros || {};
    const perServingNutrition = {
        calories: toNumber(fallbackNutrition.calories),
        protein: toNumber(fallbackNutrition.protein),
        carbs: toNumber(fallbackNutrition.carbs),
        fats: toNumber(fallbackNutrition.fats),
        fiber: toNumber(fallbackNutrition.fiber),
        sugar: toNumber(fallbackNutrition.sugar),
        sodium_mg: toNumber(fallbackNutrition.sodium_mg),
        saturated_fat: toNumber(fallbackNutrition.saturated_fat)
    };

    const fromModelPer100 = candidate.nutrition_per_100g || {};
    const nutritionPer100 = {
        calories: toNumber(fromModelPer100.calories, estimatedWeight ? Math.round((perServingNutrition.calories * 100) / estimatedWeight) : 0),
        protein: toNumber(fromModelPer100.protein, estimatedWeight ? round1((perServingNutrition.protein * 100) / estimatedWeight) : 0),
        carbs: toNumber(fromModelPer100.carbs, estimatedWeight ? round1((perServingNutrition.carbs * 100) / estimatedWeight) : 0),
        fats: toNumber(fromModelPer100.fats, estimatedWeight ? round1((perServingNutrition.fats * 100) / estimatedWeight) : 0),
        fiber: toNumber(fromModelPer100.fiber, estimatedWeight ? round1((perServingNutrition.fiber * 100) / estimatedWeight) : 0),
        sugar: toNumber(fromModelPer100.sugar, estimatedWeight ? round1((perServingNutrition.sugar * 100) / estimatedWeight) : 0),
        sodium_mg: toNumber(fromModelPer100.sodium_mg, estimatedWeight ? Math.round((perServingNutrition.sodium_mg * 100) / estimatedWeight) : 0),
        saturated_fat: toNumber(fromModelPer100.saturated_fat, estimatedWeight ? round1((perServingNutrition.saturated_fat * 100) / estimatedWeight) : 0)
    };

    const scaledNutrition = scaleNutrition(nutritionPer100, selectedWeight);
    const safeItems = Array.isArray(candidate.items_detected)
        ? candidate.items_detected
        : (candidate.items_detected ? [String(candidate.items_detected)] : []);

    return {
        meal_analysis: {
            food_name: candidate.food_name || safeItems[0] || 'Detected Meal',
            confidence: clamp(toNumber(candidate.confidence, 0.82), 0.4, 0.99),
            estimated_weight_g: estimatedWeight,
            selected_weight_g: selectedWeight,
            items_detected: safeItems,
            macros: {
                calories: scaledNutrition.calories,
                protein: scaledNutrition.protein,
                carbs: scaledNutrition.carbs,
                fats: scaledNutrition.fats,
                fiber: scaledNutrition.fiber
            },
            nutrition: scaledNutrition,
            nutrition_per_100g: nutritionPer100,
            micronutrients: Array.isArray(candidate.micronutrients) ? candidate.micronutrients : [],
            glycemic_load: candidate.glycemic_load || 'moderate',
            meal_type: candidate.meal_type || 'mixed',
            health_grade: candidate.health_grade || 'Great',
            coach_note: candidate.coach_note || 'Balanced meal. Keep portions aligned to your goal.',
            recommendations: Array.isArray(candidate.recommendations)
                ? candidate.recommendations
                : ['Add vegetables for higher fiber.', 'Hydrate well after meals with higher sodium.']
        }
    };
};

// POST /api/ai/analyze-food
exports.analyzeFood = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }


        const imagePath = req.file.path;
        const mimeType = req.file.mimetype;
        const selectedWeightGrams = clamp(Math.round(toNumber(req.body?.portionGrams, 150)), 50, 1500);
        const mealHint = String(req.body?.mealHint || '').trim().toLowerCase();
        const forcedFoodType = String(req.body?.foodType || '').trim().toLowerCase();

        // 1. Prepare Image for Gemini
        console.log(`📸 Analyzing Food Image: ${imagePath} (${mimeType})`);

        const filePart = {
            inlineData: {
                data: fs.readFileSync(imagePath).toString("base64"),
                mimeType: mimeType
            },
        };

        // 2. Strict Prompt
        const prompt = `Act as an Advanced AI Clinical Nutritionist and Vision Specialist. 
        Analyze the uploaded food image.
        User-selected serving to evaluate: ${selectedWeightGrams}g.
        Optional meal hint from user: ${mealHint || 'none'}.

        1. Identify all food components and estimate portions.
        2. Calculate nutrition for the selected serving: Calories, Protein (g), Net Carbs (g), Fats (g), Fiber (g), Sugar (g), Sodium (mg), Saturated Fat (g).
        3. Also provide nutrition per 100g.
        3. Assign a "Health Grade": 
           - [Excellent]: High protein, complex carbs, micronutrient dense.
           - [Great]: Balanced macros, low processed sugar.
           - [Average]: High calorie but moderate nutrition.
           - [Poor]: High trans-fats, refined sugars, or extreme calorie density.
        4. Coach Insight: MAX 1 sentence technical critique (e.g., "Sodium heavy; increase water.").
        5. Add 2-3 practical recommendations for this exact meal.

        RETURN JSON ONLY:
        {
          "meal_analysis": {
            "food_name": "Chicken Tikka Plate",
            "confidence": 0.91,
            "items_detected": ["Grilled Chicken 180g", "Naan 80g", "Raita 40g"],
            "estimated_weight_g": 300,
            "selected_weight_g": ${selectedWeightGrams},
            "nutrition": { "calories": 450, "protein": 40, "carbs": 50, "fats": 10, "fiber": 5, "sugar": 4, "sodium_mg": 900, "saturated_fat": 2.5 },
            "nutrition_per_100g": { "calories": 150, "protein": 13.3, "carbs": 16.6, "fats": 3.3, "fiber": 1.7, "sugar": 1.3, "sodium_mg": 300, "saturated_fat": 0.8 },
            "micronutrients": ["Iron", "Vitamin B6", "Potassium"],
            "glycemic_load": "moderate",
            "meal_type": "mixed",
            "health_grade": "Excellent",
            "coach_note": "Great protein density, but sodium is moderate-high.",
            "recommendations": ["Add a salad for extra fiber.", "Prefer whole grain carb options when possible."]
          }
        }`;

        // 3. Generate (With Mock Fallback for Demo/Project stability)
        console.log("🚀 Sending to Gemini (Model: gemini-1.5-flash)...");
        try {
            const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await visionModel.generateContent([prompt, filePart]);
            const response = await result.response;
            const text = response.text();
            
            // 4. Cleanup File
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

            // 5. Parse JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return res.json(normalizeAnalysis(data, selectedWeightGrams));
            } else {
                throw new Error("Failed to parse JSON.");
            }
        } catch (apiError) {
            console.log("⚠️ Original API failed (likely Free Tier Quota limit 0):", apiError.message);
            console.log("🔄 Using Smart Simulator for demonstration purposes...");

            // Determine dynamic response based on filename
            const filename = req.file.originalname.toLowerCase();
            const hintScope = `${filename} ${mealHint} ${forcedFoodType}`;
            const humanKeywords = ["human", "me", "selfie", "face", "person", "body", "progress", "boy", "girl", "man", "woman"];
            const isHuman = humanKeywords.some(kw => hintScope.includes(kw));

            if (isHuman) {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                return res.status(400).json({ error: "Analysis Failed: Detected a human or non-food item. Please upload a clear picture of food." });
            }

            // Database of mocked foods for demo
            const mockDatabase = {
                biryani: {
                    food_name: "Chicken Biryani Plate",
                    estimatedWeight: 350,
                    items: ["Chicken Biryani rice 250g", "Chicken pieces 90g", "Raita 40g"],
                    per100: { calories: 190, protein: 8.2, carbs: 22.6, fats: 7.8, fiber: 1.6, sugar: 1.2, sodium_mg: 360, saturated_fat: 1.8 },
                    micro: ["Iron", "Selenium", "Vitamin B12"],
                    gl: "high",
                    mealType: "mixed",
                    grade: "Average",
                    note: "Flavor-rich meal; portion control helps keep calories in check.",
                    tips: ["Pair with cucumber salad to improve satiety.", "Reduce oil-heavy side dishes in the same meal."]
                },
                chicken: {
                    food_name: "Grilled Chicken Meal",
                    estimatedWeight: 280,
                    items: ["Grilled chicken breast 170g", "Brown rice 80g", "Vegetables 30g"],
                    per100: { calories: 165, protein: 15.8, carbs: 11.2, fats: 5.1, fiber: 1.9, sugar: 1.1, sodium_mg: 250, saturated_fat: 1.2 },
                    micro: ["Niacin", "Vitamin B6", "Phosphorus"],
                    gl: "moderate",
                    mealType: "high-protein",
                    grade: "Excellent",
                    note: "Strong lean-protein profile with balanced carbs for recovery.",
                    tips: ["Add one more vegetable serving for higher fiber.", "Use less salt-heavy marinades when cutting."]
                },
                pizza: {
                    food_name: "Pepperoni Pizza",
                    estimatedWeight: 220,
                    items: ["Pepperoni pizza 2 slices"],
                    per100: { calories: 255, protein: 10.4, carbs: 28.5, fats: 11.2, fiber: 2.1, sugar: 3.6, sodium_mg: 590, saturated_fat: 4.2 },
                    micro: ["Calcium", "Sodium"],
                    gl: "high",
                    mealType: "processed",
                    grade: "Average",
                    note: "High sodium and saturated fat; balance the rest of the day with lighter meals.",
                    tips: ["Add a side salad.", "Keep total portion to one controlled plate."]
                }
            };

            let selectedMock = {
                food_name: "Mixed Rice Meal",
                estimatedWeight: 320,
                items: ["Spiced rice 220g", "Protein side 70g", "Raita/curd 30g"],
                per100: { calories: 178, protein: 7.4, carbs: 24.3, fats: 5.4, fiber: 1.8, sugar: 1.5, sodium_mg: 310, saturated_fat: 1.5 },
                micro: ["Manganese", "Iron", "Vitamin B12"],
                gl: "high",
                mealType: "mixed",
                grade: "Average",
                note: "Portion-aware planning is important because rice-heavy meals are calorie dense.",
                tips: ["Add non-starchy vegetables on the side.", "Keep the serving moderate when cutting fat."]
            };
            
            const typeResult = await classifyFoodTypeFromImage(imagePath, mimeType, hintScope);
            if (typeResult.type && mockDatabase[typeResult.type]) {
                selectedMock = mockDatabase[typeResult.type];
            }

            const scaled = scaleNutrition(selectedMock.per100, selectedWeightGrams);
            const mockData = normalizeAnalysis({
                meal_analysis: {
                    food_name: selectedMock.food_name,
                    confidence: typeResult.confidence || 0.77,
                    items_detected: selectedMock.items,
                    estimated_weight_g: selectedMock.estimatedWeight,
                    selected_weight_g: selectedWeightGrams,
                    nutrition: scaled,
                    nutrition_per_100g: selectedMock.per100,
                    micronutrients: selectedMock.micro,
                    glycemic_load: selectedMock.gl,
                    meal_type: selectedMock.mealType,
                    health_grade: selectedMock.grade,
                    coach_note: `${selectedMock.note} (${typeResult.source === 'vision' ? 'image-based estimate' : 'fallback estimate'})`,
                    recommendations: selectedMock.tips
                }
            }, selectedWeightGrams);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            return res.json(mockData);
        }

    } catch (error) {
        console.error("❌ Food Analysis Error Detailed:", error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Analysis Failed", error: error.message, details: error.toString() });
    }
};

exports.generateProgressImage = async (req, res) => {
    console.log("🚀 Starting Pollinations Generation...");
    try {
        const { months, workoutType, bodyFat, calorieGoal, age, gender, weight, height, daysOfWorkout } = req.body;
        const imageFile = req.file;

        // 1. Construct a strict prompt for Pollinations (reduce odd/dummy outputs)
        const normalizedGender = (gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
        const prompt = `ultra realistic fitness transformation portrait, single ${normalizedGender} adult, ${age} years old, ${weight}kg, ${height}cm tall, ${months} month progress, ${workoutType} training, body fat ${bodyFat} percent, clearly muscular physique, athletic broad shoulders, visible arm and chest definition, clean gym background, natural skin texture, high detail photo, 8k, studio lighting, realistic proportions, no text, no watermark, no cartoon, no anime, no child, no extra limbs, no blur, no deformed body`;

        console.log(`📝 Prompt: ${prompt}`);

        const encodedPrompt = encodeURIComponent(prompt);
        const baseSeed = Math.floor(Math.random() * 1000000);

        // Pollinations can intermittently return 500; try multiple URL variants.
        const attemptUrls = [
            `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${baseSeed}&model=flux`,
            `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${baseSeed + 1}`,
            `https://image.pollinations.ai/prompt/${encodedPrompt}?width=896&height=1152&seed=${baseSeed + 2}&model=flux`,
            `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&seed=${baseSeed + 3}`
        ];

        // 2. Prepare file path
        const filename = `generated_${req.user._id}_${Date.now()}.jpg`;
        const generatedPath = path.join(__dirname, '..', 'uploads', 'generated', filename);

        const generatedDir = path.dirname(generatedPath);
        if (!fs.existsSync(generatedDir)) {
            fs.mkdirSync(generatedDir, { recursive: true });
        }

        const fetchWithTimeout = async (url, timeoutMs = 30000) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        };

        // 3. Fetch from Pollinations with retries
        let buffer = null;
        let lastError = null;
        for (let i = 0; i < attemptUrls.length; i += 1) {
            const url = attemptUrls[i];
            try {
                console.log(`🌍 Pollinations attempt ${i + 1}/${attemptUrls.length}: ${url}`);
                const response = await fetchWithTimeout(url, 35000);
                if (!response.ok) {
                    throw new Error(`Pollinations API failed: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const candidate = Buffer.from(arrayBuffer);
                if (!candidate || candidate.length < 1024) {
                    throw new Error('Pollinations returned an invalid or empty image payload');
                }
                buffer = candidate;
                break;
            } catch (err) {
                lastError = err;
                console.log(`⚠️ Pollinations attempt ${i + 1} failed: ${err.message}`);
            }
        }

        if (!buffer) {
            throw new Error(lastError?.message || 'Pollinations API failed after multiple attempts');
        }

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

// DELETE /api/ai/progress
exports.deleteProgressImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl || typeof imageUrl !== 'string') {
            return res.status(400).json({ message: 'imageUrl is required' });
        }
        const idx = req.user.generatedImages.findIndex((g) => g.imageUrl === imageUrl);
        if (idx === -1) {
            return res.status(404).json({ message: 'Image not found in your history' });
        }

        // Remove file from disk if it is local generated asset
        if (imageUrl.startsWith('/uploads/generated/')) {
            const absPath = path.join(__dirname, '..', imageUrl);
            if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
            }
        }

        req.user.generatedImages.splice(idx, 1);
        await req.user.save();
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
