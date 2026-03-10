const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ExerciseLibrary, WeeklyPlan } = require('../models/Workout');

dotenv.config({ path: '../.env' });

const seedKinetix = async () => {
    try {
        console.log('🌱 Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🧹 Clearing existing Kinetix data...');
        await ExerciseLibrary.deleteMany({});
        await WeeklyPlan.deleteMany({});

        // --- 1. Seed Exercise Library ---
        console.log('🏋️ Seeding Exercise Library...');
        const exercises = [
            // PUSH
            { name: "Incline Barbell Bench", muscleGroup: { primary: "Upper Chest", secondary: ["Triceps", "Front Delts"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Keep your shoulder blades retracted. Lower the bar to your upper chest.", icon2D_URL: "/push_day_icon.png" },
            { name: "Dumbbell Shoulder Press", muscleGroup: { primary: "Front Delts", secondary: ["Triceps"] }, equipmentRequired: "Dumbbell", movementType: "Compound", description: "Keep your core tight, do not excessively arch your back.", icon2D_URL: "/push_day_icon.png" },
            { name: "Cable Flys", muscleGroup: { primary: "Chest", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", description: "Focus on the squeeze at the peak contraction.", icon2D_URL: "/push_day_icon.png" },
            { name: "Overhead Tricep Extensions", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", description: "Keep your elbows tucked in pointing forward.", icon2D_URL: "/push_day_icon.png" },
            { name: "Lateral Raises", muscleGroup: { primary: "Side Delts", secondary: [] }, equipmentRequired: "Dumbbell", movementType: "Isolation", description: "Pour the pitcher at the top of the movement.", icon2D_URL: "/push_day_icon.png" },
            { name: "Flat Dumbbell Bench", muscleGroup: { primary: "Chest", secondary: ["Triceps"] }, equipmentRequired: "Dumbbell", movementType: "Compound", description: "Press straight up, converging the DBs slightly.", icon2D_URL: "/push_day_icon.png" },
            { name: "Military Press", muscleGroup: { primary: "Shoulders", secondary: ["Triceps", "Core"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Push your head through the keyhole at the top.", icon2D_URL: "/push_day_icon.png" },
            { name: "Dip Station", muscleGroup: { primary: "Chest", secondary: ["Triceps"] }, equipmentRequired: "Bodyweight", movementType: "Compound", description: "Lean forward to target chest, stay upright for triceps.", icon2D_URL: "/push_day_icon.png" },
            { name: "Tricep Pushdowns", muscleGroup: { primary: "Triceps", secondary: [] }, equipmentRequired: "Cables", movementType: "Isolation", description: "Lock your elbows to your sides.", icon2D_URL: "/push_day_icon.png" },

            // PULL
            { name: "Pull-ups", muscleGroup: { primary: "Lats", secondary: ["Biceps"] }, equipmentRequired: "Bodyweight", movementType: "Compound", description: "Pull your chin over the bar, full extension at botton.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Barbell Rows", muscleGroup: { primary: "Lats", secondary: ["Lower Back", "Biceps"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Keep your back straight, pull to your belly button.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Lat Pulldowns", muscleGroup: { primary: "Lats", secondary: ["Biceps"] }, equipmentRequired: "Cables", movementType: "Compound", description: "Depress your shoulders before pulling the weight down.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Barbell Curls", muscleGroup: { primary: "Biceps", secondary: [] }, equipmentRequired: "Barbell", movementType: "Isolation", description: "Do not use momentum, keep elbows pinned to sides.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Face Pulls", muscleGroup: { primary: "Rear Delts", secondary: ["Traps"] }, equipmentRequired: "Cables", movementType: "Isolation", description: "Pull the rope towards your eyes, externally rotate.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Deadlift", muscleGroup: { primary: "Lower Back", secondary: ["Glutes", "Hamstrings"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Keep the bar close to your shins, hinge at the hips.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Rack Pulls", muscleGroup: { primary: "Lower Back", secondary: ["Traps"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Start from the knee level, squeeze glutes at the top.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Single Arm Dumbbell Row", muscleGroup: { primary: "Lats", secondary: ["Biceps"] }, equipmentRequired: "Dumbbell", movementType: "Compound", description: "Pull to your hip, control the eccentric.", icon2D_URL: "/pull_day_icon.png" },
            { name: "Hammer Curls", muscleGroup: { primary: "Biceps", secondary: ["Forearms"] }, equipmentRequired: "Dumbbell", movementType: "Isolation", description: "Neutral grip, target the brachialis.", icon2D_URL: "/pull_day_icon.png" },

            // LEGS
            { name: "Barbell Back Squat", muscleGroup: { primary: "Quads", secondary: ["Glutes", "Hamstrings"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Break parallel if mobility allows, keep chest up.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Romanian Deadlift", muscleGroup: { primary: "Hamstrings", secondary: ["Glutes", "Lower Back"] }, equipmentRequired: "Barbell", movementType: "Compound", description: "Hinge at the hips, slight bend in knees.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Leg Press", muscleGroup: { primary: "Quads", secondary: ["Glutes"] }, equipmentRequired: "Machine", movementType: "Compound", description: "Do not lock out your knees at the top.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Leg Curls", muscleGroup: { primary: "Hamstrings", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", description: "Control the weight, squeeze at the top.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Calf Raises", muscleGroup: { primary: "Calves", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", description: "Full stretch at bottom, full contraction at top.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Bulgarian Split Squats", muscleGroup: { primary: "Quads", secondary: ["Glutes"] }, equipmentRequired: "Dumbbell", movementType: "Compound", description: "Elevate rear foot, drop straight down.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Goblet Squat", muscleGroup: { primary: "Quads", secondary: ["Core"] }, equipmentRequired: "Dumbbell", movementType: "Compound", description: "Hold DB at chest, great for improving mobility.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Lying Leg Curls", muscleGroup: { primary: "Hamstrings", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", description: "Keep your hips pushed down into the pad.", icon2D_URL: "/leg_day_icon.png" },
            { name: "Seated Calf Raises", muscleGroup: { primary: "Calves", secondary: [] }, equipmentRequired: "Machine", movementType: "Isolation", description: "Targets the soleus under the gastrocnemius.", icon2D_URL: "/leg_day_icon.png" }
        ];

        const insertedExercises = await ExerciseLibrary.insertMany(exercises);
        
        // Helper to find an inserted exercise's ID by name
        const getExId = (name) => insertedExercises.find(ex => ex.name === name)?._id;

        // --- 2. Build the PPL Weekly Plan ---
        console.log('📅 Creating PPL Weekly Plan...');
        const pplPlan = new WeeklyPlan({
            philosophyName: "PPL (6-Day Intermediate)",
            description: "A classic Push/Pull/Legs split alternating between compound strength and hypertrophy focus.",
            isDefault: true,
            days: [
                // 0: Sunday
                {
                    dayName: "Sunday - Rest", dayOfWeek: 0, isRestDay: true,
                    focus: "Rest & Recovery",
                    recoverySuggestions: ["Foam Rolling: Quads, Lats", "Yoga mobility routine", "Light walk (10k steps)"]
                },
                // 1: Monday
                {
                    dayName: "Monday - Push", dayOfWeek: 1, focus: "Chest, Shoulders, Triceps focus",
                    blocks: [
                        { exercise: getExId("Incline Barbell Bench"), targetSets: 4, targetReps: "8", targetRPE: 8 },
                        { exercise: getExId("Dumbbell Shoulder Press"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getExId("Cable Flys"), targetSets: 3, targetReps: "12-15", targetRPE: 9 },
                        { exercise: getExId("Overhead Tricep Extensions"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getExId("Lateral Raises"), targetSets: 4, targetReps: "15", targetRPE: 9 }
                    ]
                },
                // 2: Tuesday
                {
                    dayName: "Tuesday - Pull", dayOfWeek: 2, focus: "Back, Biceps focus",
                    blocks: [
                        { exercise: getExId("Pull-ups"), targetSets: 3, targetReps: "Failure", targetRPE: 10 },
                        { exercise: getExId("Barbell Rows"), targetSets: 4, targetReps: "8", targetRPE: 8 },
                        { exercise: getExId("Lat Pulldowns"), targetSets: 3, targetReps: "12", targetRPE: 8 },
                        { exercise: getExId("Barbell Curls"), targetSets: 3, targetReps: "10-12", targetRPE: 9 },
                        { exercise: getExId("Face Pulls"), targetSets: 3, targetReps: "15", targetRPE: 8 }
                    ]
                },
                // 3: Wednesday
                {
                    dayName: "Wednesday - Legs", dayOfWeek: 3, focus: "Quads, Hamstrings, Calves focus",
                    blocks: [
                        { exercise: getExId("Barbell Back Squat"), targetSets: 4, targetReps: "6-8", targetRPE: 8 },
                        { exercise: getExId("Romanian Deadlift"), targetSets: 3, targetReps: "10", targetRPE: 8 },
                        { exercise: getExId("Leg Press"), targetSets: 3, targetReps: "12", targetRPE: 9 },
                        { exercise: getExId("Leg Curls"), targetSets: 3, targetReps: "12", targetRPE: 9 },
                        { exercise: getExId("Calf Raises"), targetSets: 4, targetReps: "15-20", targetRPE: 9 }
                    ]
                },
                // 4: Thursday
                {
                    dayName: "Thursday - Push", dayOfWeek: 4, focus: "Volume Focus - Secondary variations",
                    blocks: [
                        { exercise: getExId("Flat Dumbbell Bench"), targetSets: 4, targetReps: "10", targetRPE: 8 },
                        { exercise: getExId("Military Press"), targetSets: 3, targetReps: "8-10", targetRPE: 8 },
                        { exercise: getExId("Dip Station"), targetSets: 3, targetReps: "Failure", targetRPE: 9 },
                        { exercise: getExId("Tricep Pushdowns"), targetSets: 3, targetReps: "15", targetRPE: 9 },
                        { exercise: getExId("Lateral Raises"), targetSets: 4, targetReps: "15", targetRPE: 9 }
                    ]
                },
                // 5: Friday
                {
                    dayName: "Friday - Pull", dayOfWeek: 5, focus: "Width/Thickness Focus",
                    blocks: [
                        { exercise: getExId("Deadlift"), targetSets: 3, targetReps: "5", targetRPE: 9 },
                        { exercise: getExId("Rack Pulls"), targetSets: 3, targetReps: "8", targetRPE: 8 },
                        { exercise: getExId("Single Arm Dumbbell Row"), targetSets: 3, targetReps: "10-12", targetRPE: 8 },
                        { exercise: getExId("Hammer Curls"), targetSets: 4, targetReps: "12", targetRPE: 9 }
                    ]
                },
                // 6: Saturday
                {
                    dayName: "Saturday - Legs", dayOfWeek: 6, focus: "Hypertrophy/Accessory Focus",
                    blocks: [
                        { exercise: getExId("Bulgarian Split Squats"), targetSets: 3, targetReps: "10-12", targetRPE: 9 },
                        { exercise: getExId("Goblet Squat"), targetSets: 3, targetReps: "12-15", targetRPE: 8 },
                        { exercise: getExId("Lying Leg Curls"), targetSets: 3, targetReps: "15", targetRPE: 9 },
                        { exercise: getExId("Seated Calf Raises"), targetSets: 4, targetReps: "20", targetRPE: 9 }
                    ]
                }
            ]
        });

        await pplPlan.save();
        console.log('✅ Seeding Complete!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    }
};

seedKinetix();
