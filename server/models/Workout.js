const mongoose = require('mongoose');

// 1. Master Exercise Library
const exerciseLibrarySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    muscleGroup: {
        primary: { type: String, required: true },
        secondary: { type: [String], default: [] }
    },
    equipmentRequired: { type: String, enum: ['Barbell', 'Dumbbell', 'Machine', 'Cables', 'Bodyweight', 'Other'], default: 'Other' },
    movementType: { type: String, enum: ['Compound', 'Isolation', 'Isometric'], required: true },
    description: { type: String, default: '' }, // Pro-tips and common mistakes
    animationURL: { type: String, default: '' }, // Direct link to GIF/MP4
    icon2D_URL: { type: String, default: '' }, // Direct link to static illustration
}, { timestamps: true });

const ExerciseLibrary = mongoose.model('ExerciseLibrary', exerciseLibrarySchema);


// 2. Exercise Block (A specific prescription within a daily session)
const exerciseBlockSchema = new mongoose.Schema({
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseLibrary', required: true },
    targetSets: { type: Number, required: true },
    targetReps: { type: String, required: true }, // String to allow "8-10" or "Failure"
    targetRPE: { type: Number, min: 1, max: 10, default: 8 },
    restTimerSeconds: { type: Number, default: 90 }
});


// 3. Daily Session (One day of a weekly plan)
const dailySessionSchema = new mongoose.Schema({
    dayName: { type: String, required: true }, // e.g., "Monday - Push", "Sunday - Rest"
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday
    isRestDay: { type: Boolean, default: false },
    focus: { type: String, default: '' }, // e.g., "Chest, Shoulders, Triceps focus"
    blocks: [exerciseBlockSchema],
    recoverySuggestions: { type: [String], default: [] } // Used if isRestDay is true
});


// 4. Weekly Plan (The Master Document)
const weeklyPlanSchema = new mongoose.Schema({
    philosophyName: { type: String, required: true, unique: true }, // e.g., "PPL (6-Day Intermediate)"
    description: { type: String, default: '' },
    days: [dailySessionSchema], // Should ideally contain 7 entries (Mon-Sun)
    isDefault: { type: Boolean, default: false } // Flag to identify standard system plans
}, { timestamps: true });

const WeeklyPlan = mongoose.model('WeeklyPlan', weeklyPlanSchema);


// 5. Workout Log (Tracking real user progress)
const completedSetSchema = new mongoose.Schema({
    setNumber: { type: Number, required: true },
    weight: { type: Number, required: true }, // in kg
    reps: { type: Number, required: true },
    rpe: { type: Number }
});

const workoutLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyPlan' },
    sessionName: { type: String, required: true }, // Snapshot of the DailySession name
    exercises: [{
        exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseLibrary', required: true },
        sets: [completedSetSchema]
    }],
    durationMinutes: { type: Number },
    notes: { type: String, default: '' }
}, { timestamps: true });

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

module.exports = {
    ExerciseLibrary,
    WeeklyPlan,
    WorkoutLog
};
