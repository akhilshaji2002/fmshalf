const { calculateHealthMetrics } = require('./server/controllers/aiController');

// Mock Request
const req = {
    body: {
        age: 25,
        weight: 70,
        height: 175,
        gender: 'male',
        activityLevel: 'moderate',
        goals: 'build muscle',
        userId: null // Don't save to DB for this test, just check calculation
    }
};

// Mock Response
const res = {
    json: (data) => {
        console.log("---------------------------------------------------");
        console.log("✅ API RESPONSE:");
        console.log(JSON.stringify(data, null, 2));
        console.log("---------------------------------------------------");

        // Assertions
        const safe = (val) => typeof val === 'number' && !isNaN(val) && val > 0;

        const bmrOk = safe(data.bmr);
        const tdeeOk = safe(data.tdee);
        const proteinOk = safe(data.dietPlan.macros.protein);
        const carbsOk = safe(data.dietPlan.macros.carbs);
        const fatsOk = safe(data.dietPlan.macros.fats);

        if (bmrOk && tdeeOk && proteinOk && carbsOk && fatsOk) {
            console.log("🎉 SUCCESS: All values are valid numbers!");
        } else {
            console.error("❌ FAILURE: Some values are missing or zero.");
        }
    },
    status: (code) => {
        console.log(`Status Code: ${code}`);
        return {
            json: (err) => console.log("Error:", err)
        };
    }
};

console.log("🚀 Testing calculateHealthMetrics...");
calculateHealthMetrics(req, res);
