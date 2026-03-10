const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ExerciseLibrary, WeeklyPlan } = require('../models/Workout');

dotenv.config({ path: '../.env' });

const seedDemographics = async () => {
    try {
        console.log('🌱 Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🧹 Clearing existing Kinetix Demographic data...');
        await ExerciseLibrary.deleteMany({});
        await WeeklyPlan.deleteMany({});

        // --- 1. Seed Massive 49+ Exercise Library (7 per body part) ---
        console.log('🏋️ Seeding 49-Exercise Library...');
        const exercises = [
            // CHEST / PUSH (/push_day_icon.png)
            { name: "Barbell Bench Press", muscleGroup: { primary: "Chest", secondary: ["Triceps", "Front Delts"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/push_day_icon.png" },
            { name: "Incline Dumbbell Press", muscleGroup: { primary: "Upper Chest", secondary: ["Triceps"] }, equipmentRequired: "Dumbbell", movementType: "Compound", icon2D_URL: "/push_day_icon.png" },
            { name: "Cable Crossover", muscleGroup: { primary: "Chest", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/push_day_icon.png" },
            { name: "Pushups", muscleGroup: { primary: "Chest", secondary: ["Triceps", "Core"] }, equipmentRequired: "Bodyweight", movementType: "Compound", icon2D_URL: "/push_day_icon.png" },
            { name: "Chest Dips", muscleGroup: { primary: "Lower Chest", secondary: ["Triceps"] }, equipmentRequired: "Bodyweight", movementType: "Compound", icon2D_URL: "/push_day_icon.png" },
            { name: "Pec Deck Machine", muscleGroup: { primary: "Chest", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", icon2D_URL: "/push_day_icon.png" },
            { name: "Decline Barbell Press", muscleGroup: { primary: "Lower Chest", secondary: ["Triceps"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/push_day_icon.png" },

            // BACK / PULL (/pull_day_icon.png)
            { name: "Pull-ups", muscleGroup: { primary: "Lats", secondary: ["Biceps"] }, equipmentRequired: "Bodyweight", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "Barbell Rows", muscleGroup: { primary: "Middle Back", secondary: ["Biceps", "Lower Back"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "Lat Pulldown", muscleGroup: { primary: "Lats", secondary: ["Biceps"] }, equipmentRequired: "Cables", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "T-Bar Row", muscleGroup: { primary: "Middle Back", secondary: ["Lats"] }, equipmentRequired: "Machine", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "Seated Cable Row", muscleGroup: { primary: "Middle Back", secondary: ["Biceps"] }, equipmentRequired: "Cables", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "Deadlift", muscleGroup: { primary: "Lower Back", secondary: ["Glutes", "Hamstrings", "Traps"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/pull_day_icon.png" },
            { name: "Straight Arm Pulldown", muscleGroup: { primary: "Lats", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/pull_day_icon.png" },

            // LEGS (/leg_day_icon.png)
            { name: "Barbell Back Squat", muscleGroup: { primary: "Quads", secondary: ["Glutes", "Hamstrings"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/leg_day_icon.png" },
            { name: "Leg Press", muscleGroup: { primary: "Quads", secondary: ["Glutes"] }, equipmentRequired: "Machine", movementType: "Compound", icon2D_URL: "/leg_day_icon.png" },
            { name: "Romanian Deadlift", muscleGroup: { primary: "Hamstrings", secondary: ["Glutes", "Lower Back"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/leg_day_icon.png" },
            { name: "Lying Leg Curls", muscleGroup: { primary: "Hamstrings", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", icon2D_URL: "/leg_day_icon.png" },
            { name: "Bulgarian Split Squat", muscleGroup: { primary: "Quads", secondary: ["Glutes"] }, equipmentRequired: "Dumbbell", movementType: "Compound", icon2D_URL: "/leg_day_icon.png" },
            { name: "Standing Calf Raises", muscleGroup: { primary: "Calves", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", icon2D_URL: "/leg_day_icon.png" },
            { name: "Walking Lunges", muscleGroup: { primary: "Quads", secondary: ["Glutes", "Hamstrings"] }, equipmentRequired: "Dumbbell", movementType: "Compound", icon2D_URL: "/leg_day_icon.png" },

            // SHOULDERS (/shoulders_icon.png)
            { name: "Overhead Barbell Press", muscleGroup: { primary: "Front Delts", secondary: ["Triceps", "Upper Chest"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/shoulders_icon.png" },
            { name: "Dumbbell Lateral Raises", muscleGroup: { primary: "Side Delts", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/shoulders_icon.png" },
            { name: "Dumbbell Front Raises", muscleGroup: { primary: "Front Delts", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/shoulders_icon.png" },
            { name: "Reverse Pec Deck", muscleGroup: { primary: "Rear Delts", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", icon2D_URL: "/shoulders_icon.png" },
            { name: "Upright Row", muscleGroup: { primary: "Side Delts", secondary: ["Traps"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/shoulders_icon.png" },
            { name: "Arnold Press", muscleGroup: { primary: "Front Delts", secondary: ["Triceps"] }, equipmentRequired: "Dumbbell", movementType: "Compound", icon2D_URL: "/shoulders_icon.png" },
            { name: "Face Pulls", muscleGroup: { primary: "Rear Delts", secondary: ["Traps"] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/shoulders_icon.png" },

            // BICEPS (/biceps_icon.png)
            { name: "Barbell Bicep Curl", muscleGroup: { primary: "Biceps", secondary: ["Forearms"] }, equipmentRequired: "Barbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "Dumbbell Hammer Curl", muscleGroup: { primary: "Brachialis", secondary: ["Biceps", "Forearms"] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "Incline Dumbbell Curl", muscleGroup: { primary: "Biceps (Long Head)", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "EZ-Bar Preacher Curl", muscleGroup: { primary: "Biceps (Short Head)", secondary: [] }, equipmentRequired: "Barbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "Concentration Curl", muscleGroup: { primary: "Biceps", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "Cable Bicep Curl", muscleGroup: { primary: "Biceps", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },
            { name: "Reverse Barbell Curl", muscleGroup: { primary: "Forearms", secondary: ["Biceps"] }, equipmentRequired: "Barbell", movementType: "Isolation", icon2D_URL: "/biceps_icon.png" },

            // TRICEPS (/triceps_icon.png)
            { name: "Tricep Rope Pushdown", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/triceps_icon.png" },
            { name: "Skullcrushers", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Barbell", movementType: "Isolation", icon2D_URL: "/triceps_icon.png" },
            { name: "Overhead Dumbbell Extension", muscleGroup: { primary: "Triceps (Long Head)", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/triceps_icon.png" },
            { name: "Close Grip Bench Press", muscleGroup: { primary: "Triceps", secondary: ["Chest"] }, equipmentRequired: "Barbell", movementType: "Compound", icon2D_URL: "/triceps_icon.png" },
            { name: "Tricep Kickbacks", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/triceps_icon.png" },
            { name: "V-Bar Pushdown", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", icon2D_URL: "/triceps_icon.png" },
            { name: "Bench Dips", muscleGroup: { primary: "Triceps", secondary: ["Chest", "Front Delts"] }, equipmentRequired: "Bodyweight", movementType: "Compound", icon2D_URL: "/triceps_icon.png" },

            // CORE (/core_icon.png)
            { name: "Crunches", muscleGroup: { primary: "Upper Abs", secondary: [] }, equipmentRequired: "Bodyweight", movementType: "Isolation", icon2D_URL: "/core_icon.png" },
            { name: "Plank", muscleGroup: { primary: "Core (Transverse Abdominis)", secondary: ["Shoulders"] }, equipmentRequired: "Bodyweight", movementType: "Isometric", icon2D_URL: "/core_icon.png" },
            { name: "Hanging Leg Raises", muscleGroup: { primary: "Lower Abs", secondary: ["Hip Flexors"] }, equipmentRequired: "Bodyweight", movementType: "Isolation", icon2D_URL: "/core_icon.png" },
            { name: "Russian Twists", muscleGroup: { primary: "Obliques", secondary: ["Core"] }, equipmentRequired: "Dumbbell", movementType: "Isolation", icon2D_URL: "/core_icon.png" },
            { name: "Ab Wheel Rollout", muscleGroup: { primary: "Core", secondary: ["Lats", "Shoulders"] }, equipmentRequired: "Other", movementType: "Compound", icon2D_URL: "/core_icon.png" },
            { name: "Bicycle Crunches", muscleGroup: { primary: "Obliques", secondary: ["Upper Abs"] }, equipmentRequired: "Bodyweight", movementType: "Isolation", icon2D_URL: "/core_icon.png" },
            { name: "Cable Woodchoppers", muscleGroup: { primary: "Obliques", secondary: ["Core"] }, equipmentRequired: "Cables", movementType: "Compound", icon2D_URL: "/core_icon.png" }
        ];

        const insertedExercises = await ExerciseLibrary.insertMany(exercises);
        const getEx = (name) => insertedExercises.find(ex => ex.name === name)?._id;

        // --- 2. Build Demographic Plans ---
        console.log('📅 Building 6-Tier Demographic Macrocycles...');

        // Base Day Template Helper
        const R = { dayName: "Rest & Pre-Hab", dayOfWeek: 0, isRestDay: true, focus: "Recovery", recoverySuggestions: ["Light walking", "Yoga", "Mobility Drills"] };

        const plans = [
            // TIER 1: Sub-Juniors (<14)
            new WeeklyPlan({
                philosophyName: "Tier 1: Sub-Juniors (<14)",
                description: "Focus on motor skill acquisition, calisthenics, and pre-hab. Low spinal load.",
                isDefault: true,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Mechanics", dayOfWeek: 1, focus: "Bodyweight Push & Core", blocks: [
                        { exercise: getEx("Pushups"), targetSets: 3, targetReps: "10-15", targetRPE: 7, restTimerSeconds: 60 },
                        { exercise: getEx("Bench Dips"), targetSets: 3, targetReps: "10", targetRPE: 6, restTimerSeconds: 60 },
                        { exercise: getEx("Plank"), targetSets: 3, targetReps: "60s", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { dayName: "Tuesday - Pull", dayOfWeek: 2, focus: "Upper Back Posture", blocks: [
                        { exercise: getEx("Pull-ups"), targetSets: 3, targetReps: "Max", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Face Pulls"), targetSets: 3, targetReps: "15", targetRPE: 6, restTimerSeconds: 60 }
                    ]},
                    { dayName: "Wednesday - Legs", dayOfWeek: 3, focus: "Bodyweight Lower", blocks: [
                        { exercise: getEx("Walking Lunges"), targetSets: 3, targetReps: "20 steps", targetRPE: 7, restTimerSeconds: 60 },
                        { exercise: getEx("Standing Calf Raises"), targetSets: 3, targetReps: "20", targetRPE: 6, restTimerSeconds: 45 }
                    ]},
                    { ...R, dayOfWeek: 4 },
                    { dayName: "Friday - Full Body", dayOfWeek: 5, focus: "Conditioning & Coordination", blocks: [
                        { exercise: getEx("Pushups"), targetSets: 3, targetReps: "Failure", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Pull-ups"), targetSets: 3, targetReps: "Failure", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Bicycle Crunches"), targetSets: 3, targetReps: "30", targetRPE: 7, restTimerSeconds: 60 }
                    ]},
                    { ...R, dayOfWeek: 6 }
                ]
            }),

            // TIER 2: Juniors (<18)
            new WeeklyPlan({
                philosophyName: "Tier 2: Juniors (<18)",
                description: "Introduction to moderate hypertrophic loads and explosive power.",
                isDefault: false,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Push Power", dayOfWeek: 1, focus: "Hypertrophy Push", blocks: [
                        { exercise: getEx("Barbell Bench Press"), targetSets: 4, targetReps: "8-10", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Overhead Barbell Press"), targetSets: 3, targetReps: "10", targetRPE: 7, restTimerSeconds: 90 },
                        { exercise: getEx("Tricep Rope Pushdown"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { dayName: "Tuesday - Pull Power", dayOfWeek: 2, focus: "Hypertrophy Pull", blocks: [
                        { exercise: getEx("Lat Pulldown"), targetSets: 4, targetReps: "10", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Barbell Rows"), targetSets: 3, targetReps: "10", targetRPE: 7, restTimerSeconds: 90 },
                        { exercise: getEx("Barbell Bicep Curl"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { dayName: "Wednesday - Legs Introduction", dayOfWeek: 3, focus: "Moderate Lower Body", blocks: [
                        { exercise: getEx("Barbell Back Squat"), targetSets: 4, targetReps: "8", targetRPE: 7, restTimerSeconds: 120 },
                        { exercise: getEx("Leg Press"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Hanging Leg Raises"), targetSets: 3, targetReps: "15", targetRPE: 7, restTimerSeconds: 60 }
                    ]},
                    { ...R, dayOfWeek: 4 },
                    { dayName: "Friday - Full Body Aux", dayOfWeek: 5, focus: "Arms & Delts", blocks: [
                        { exercise: getEx("Dumbbell Lateral Raises"), targetSets: 4, targetReps: "15", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Dumbbell Hammer Curl"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Skullcrushers"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { ...R, dayOfWeek: 6 }
                ]
            }),

            // TIER 3: Youth (<23)
            new WeeklyPlan({
                philosophyName: "Tier 3: Youth (<23)",
                description: "High-volume, high-intensity strength and hypertrophy conditioning.",
                isDefault: false,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Heavy Push", dayOfWeek: 1, focus: "Strength", blocks: [
                        { exercise: getEx("Barbell Bench Press"), targetSets: 5, targetReps: "5", targetRPE: 9, restTimerSeconds: 120 },
                        { exercise: getEx("Incline Dumbbell Press"), targetSets: 4, targetReps: "8-10", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Chest Dips"), targetSets: 3, targetReps: "Failure", targetRPE: 9, restTimerSeconds: 90 },
                        { exercise: getEx("Close Grip Bench Press"), targetSets: 3, targetReps: "8", targetRPE: 8, restTimerSeconds: 90 }
                    ]},
                    { dayName: "Tuesday - Heavy Pull", dayOfWeek: 2, focus: "Strength", blocks: [
                        { exercise: getEx("Deadlift"), targetSets: 5, targetReps: "5", targetRPE: 9, restTimerSeconds: 180 },
                        { exercise: getEx("Pull-ups"), targetSets: 4, targetReps: "Failure", targetRPE: 9, restTimerSeconds: 90 },
                        { exercise: getEx("Barbell Rows"), targetSets: 4, targetReps: "8", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Barbell Bicep Curl"), targetSets: 3, targetReps: "10", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { dayName: "Wednesday - Heavy Legs", dayOfWeek: 3, focus: "Strength", blocks: [
                        { exercise: getEx("Barbell Back Squat"), targetSets: 5, targetReps: "5", targetRPE: 9, restTimerSeconds: 120 },
                        { exercise: getEx("Romanian Deadlift"), targetSets: 4, targetReps: "8", targetRPE: 8, restTimerSeconds: 90 },
                        { exercise: getEx("Standing Calf Raises"), targetSets: 4, targetReps: "15", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Ab Wheel Rollout"), targetSets: 3, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 }
                    ]},
                    { ...R, dayOfWeek: 4 },
                    { dayName: "Friday - Hypertrophy Upper", dayOfWeek: 5, focus: "Pump Work", blocks: [
                        { exercise: getEx("Cable Crossover"), targetSets: 4, targetReps: "12-15", targetRPE: 9, restTimerSeconds: 60 },
                        { elimination: false, exercise: getEx("Seated Cable Row"), targetSets: 4, targetReps: "12", targetRPE: 8, restTimerSeconds: 60 },
                        { exercise: getEx("Dumbbell Lateral Raises"), targetSets: 4, targetReps: "15", targetRPE: 9, restTimerSeconds: 45 },
                        { exercise: getEx("Concentration Curl"), targetSets: 3, targetReps: "12", targetRPE: 9, restTimerSeconds: 45 },
                        { exercise: getEx("V-Bar Pushdown"), targetSets: 3, targetReps: "12", targetRPE: 9, restTimerSeconds: 45 }
                    ]},
                    { dayName: "Saturday - Hypertrophy Lower", dayOfWeek: 6, focus: "Pump Work", blocks: [
                        { exercise: getEx("Leg Press"), targetSets: 4, targetReps: "15", targetRPE: 9, restTimerSeconds: 90 },
                        { exercise: getEx("Bulgarian Split Squat"), targetSets: 3, targetReps: "12", targetRPE: 9, restTimerSeconds: 90 },
                        { exercise: getEx("Lying Leg Curls"), targetSets: 4, targetReps: "15", targetRPE: 9, restTimerSeconds: 60 },
                        { exercise: getEx("Russian Twists"), targetSets: 3, targetReps: "20", targetRPE: 8, restTimerSeconds: 60 }
                    ]}
                ]
            }),

            // TIER 4: Seniors (24-40) - Standard Advanced PPL
            new WeeklyPlan({
                philosophyName: "Tier 4: Seniors (24-40)",
                description: "Peak performance strength, heavy compounds with balanced aesthetic isolation.",
                isDefault: false,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Push", dayOfWeek: 1, focus: "Chest & Triceps", blocks: [
                        { exercise: getEx("Barbell Bench Press"), targetSets: 4, targetReps: "8", targetRPE: 8 },
                        { exercise: getEx("Overhead Barbell Press"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getEx("Incline Dumbbell Press"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getEx("Skullcrushers"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Dumbbell Lateral Raises"), targetSets: 4, targetReps: "15", targetRPE: 9 }
                    ]},
                    { dayName: "Tuesday - Pull", dayOfWeek: 2, focus: "Back & Biceps", blocks: [
                        { exercise: getEx("Pull-ups"), targetSets: 4, targetReps: "Failure", targetRPE: 9 },
                        { exercise: getEx("Barbell Rows"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getEx("EZ-Bar Preacher Curl"), targetSets: 3, targetReps: "12", targetRPE: 9 },
                        { exercise: getEx("Face Pulls"), targetSets: 3, targetReps: "15", targetRPE: 8 },
                        { exercise: getEx("Dumbbell Hammer Curl"), targetSets: 3, targetReps: "12", targetRPE: 8 }
                    ]},
                    { dayName: "Wednesday - Legs", dayOfWeek: 3, focus: "Quads & Hams", blocks: [
                        { exercise: getEx("Barbell Back Squat"), targetSets: 4, targetReps: "6-8", targetRPE: 9 },
                        { exercise: getEx("Romanian Deadlift"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getEx("Leg Press"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Standing Calf Raises"), targetSets: 4, targetReps: "15", targetRPE: 9 },
                        { exercise: getEx("Plank"), targetSets: 3, targetReps: "60s", targetRPE: 8 }
                    ]},
                    { ...R, dayOfWeek: 4 },
                    { dayName: "Friday - Upper Accessory", dayOfWeek: 5, focus: "Arms & Delts", blocks: [
                        { exercise: getEx("Arnold Press"), targetSets: 4, targetReps: "10", targetRPE: 8 },
                        { exercise: getEx("Cable Crossover"), targetSets: 3, targetReps: "15", targetRPE: 9 },
                        { exercise: getEx("Lat Pulldown"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Cable Bicep Curl"), targetSets: 3, targetReps: "15", targetRPE: 9 },
                        { exercise: getEx("Tricep Rope Pushdown"), targetSets: 3, targetReps: "15", targetRPE: 9 }
                    ]},
                    { dayName: "Saturday - Lower Accessory", dayOfWeek: 6, focus: "Hinges & Core", blocks: [
                        { exercise: getEx("Deadlift"), targetSets: 3, targetReps: "5", targetRPE: 9 },
                        { exercise: getEx("Walking Lunges"), targetSets: 3, targetReps: "20", targetRPE: 8 },
                        { exercise: getEx("Lying Leg Curls"), targetSets: 3, targetReps: "15", targetRPE: 9 },
                        { exercise: getEx("Cable Woodchoppers"), targetSets: 3, targetReps: "15", targetRPE: 8 }
                    ]}
                ]
            }),

            // TIER 5: Masters (40+)
            new WeeklyPlan({
                philosophyName: "Tier 5: Masters (40+)",
                description: "Reduced spinal loading, joint-friendly variations, machine bias.",
                isDefault: false,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Push (Joint Friendly)", dayOfWeek: 1, focus: "Machine Chest", blocks: [
                        { exercise: getEx("Pec Deck Machine"), targetSets: 3, targetReps: "12-15", targetRPE: 8 },
                        { exercise: getEx("Incline Dumbbell Press"), targetSets: 3, targetReps: "10-12", targetRPE: 7 },
                        { exercise: getEx("Tricep Rope Pushdown"), targetSets: 3, targetReps: "15", targetRPE: 8 },
                        { exercise: getEx("Dumbbell Lateral Raises"), targetSets: 3, targetReps: "15", targetRPE: 8 }
                    ]},
                    { dayName: "Tuesday - Pull (Supported)", dayOfWeek: 2, focus: "Supported Back", blocks: [
                        { exercise: getEx("Lat Pulldown"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Seated Cable Row"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Dumbbell Hammer Curl"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getEx("Straight Arm Pulldown"), targetSets: 3, targetReps: "15", targetRPE: 8 }
                    ]},
                    { ...R, dayOfWeek: 3 },
                    { dayName: "Thursday - Legs (Low Spine Load)", dayOfWeek: 4, focus: "Machine Legs", blocks: [
                        { exercise: getEx("Leg Press"), targetSets: 4, targetReps: "12-15", targetRPE: 8 },
                        { exercise: getEx("Lying Leg Curls"), targetSets: 3, targetReps: "15", targetRPE: 8 },
                        { exercise: getEx("Standing Calf Raises"), targetSets: 3, targetReps: "20", targetRPE: 8 },
                        { exercise: getEx("Plank"), targetSets: 3, targetReps: "60s", targetRPE: 7 }
                    ]},
                    { ...R, dayOfWeek: 5 },
                    { dayName: "Saturday - Delts & Core", dayOfWeek: 6, focus: "Shoulder Health", blocks: [
                        { exercise: getEx("Arnold Press"), targetSets: 3, targetReps: "12", targetRPE: 7 },
                        { exercise: getEx("Reverse Pec Deck"), targetSets: 3, targetReps: "15", targetRPE: 8 },
                        { exercise: getEx("Face Pulls"), targetSets: 3, targetReps: "15", targetRPE: 8 },
                        { exercise: getEx("Crunches"), targetSets: 3, targetReps: "20", targetRPE: 7 }
                    ]}
                ]
            }),

            // TIER 6: Grandmasters (60+)
            new WeeklyPlan({
                philosophyName: "Tier 6: Grandmasters (60+)",
                description: "Bone density preservation, machine-based stability, metabolic conditioning.",
                isDefault: false,
                days: [
                    { ...R, dayOfWeek: 0 },
                    { dayName: "Monday - Total Body Wellness", dayOfWeek: 1, focus: "Light Resistance", blocks: [
                        { exercise: getEx("Leg Press"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Lat Pulldown"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Pec Deck Machine"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Tricep Rope Pushdown"), targetSets: 2, targetReps: "15", targetRPE: 6 }
                    ]},
                    { ...R, dayOfWeek: 2 },
                    { dayName: "Wednesday - Core & Stability", dayOfWeek: 3, focus: "Balance", blocks: [
                        { exercise: getEx("Walking Lunges"), targetSets: 2, targetReps: "12", targetRPE: 5 },
                        { exercise: getEx("Dumbbell Lateral Raises"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Dumbbell Hammer Curl"), targetSets: 2, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Plank"), targetSets: 3, targetReps: "45s", targetRPE: 7 }
                    ]},
                    { ...R, dayOfWeek: 4 },
                    { dayName: "Friday - Back & Posture", dayOfWeek: 5, focus: "Spinal Erectors", blocks: [
                        { exercise: getEx("Seated Cable Row"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Face Pulls"), targetSets: 3, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Straight Arm Pulldown"), targetSets: 2, targetReps: "15", targetRPE: 6 },
                        { exercise: getEx("Standing Calf Raises"), targetSets: 3, targetReps: "15", targetRPE: 6 }
                    ]},
                    { ...R, dayOfWeek: 6 }
                ]
            })
        ];

        for (const plan of plans) {
            await plan.save();
            console.log(`Saved plan: ${plan.philosophyName}`);
        }

        console.log('✅ Demographic Seeding Complete!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    }
};

seedDemographics();
