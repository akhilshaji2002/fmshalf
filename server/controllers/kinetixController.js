const { WeeklyPlan, WorkoutLog, ExerciseLibrary } = require('../models/Workout');
const User = require('../models/User');

const getDayRange = (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getTierTargetBlocks = (philosophyName = '') => {
    if (philosophyName.includes('Tier 3')) return 8; // Youth: max volume
    if (philosophyName.includes('Tier 4')) return 7; // Seniors: high but sustainable
    return null;
};

const scoreExerciseForDay = (exercise, day) => {
    const text = `${day.dayName} ${day.focus}`.toLowerCase();
    const muscle = exercise?.muscleGroup?.primary?.toLowerCase() || '';
    let score = 0;
    if (text.includes('push') && (muscle.includes('chest') || muscle.includes('triceps') || muscle.includes('delt'))) score += 4;
    if (text.includes('pull') && (muscle.includes('back') || muscle.includes('lat') || muscle.includes('biceps'))) score += 4;
    if (text.includes('leg') && (muscle.includes('quad') || muscle.includes('hamstring') || muscle.includes('glute') || muscle.includes('calf'))) score += 4;
    if (text.includes('core') && (muscle.includes('core') || muscle.includes('abs') || muscle.includes('oblique'))) score += 3;
    if (text.includes('delts') && muscle.includes('delt')) score += 3;
    if (text.includes('arms') && (muscle.includes('biceps') || muscle.includes('triceps') || muscle.includes('forearm'))) score += 3;
    if (text.includes(muscle)) score += 2;
    return score;
};

// Fetch the user's active workout plan by tier (or default)
exports.getWeeklyPlan = async (req, res) => {
    try {
        const { tier } = req.query;
        let query = tier ? { philosophyName: { $regex: tier, $options: 'i' } } : { isDefault: true };

        let plan = await WeeklyPlan.findOne(query).populate({
            path: 'days.blocks.exercise',
            model: 'ExerciseLibrary'
        });

        // Fallback if the requested tier wasn't found perfectly
        if (!plan && tier) {
            plan = await WeeklyPlan.findOne({ isDefault: true }).populate({
                path: 'days.blocks.exercise',
                model: 'ExerciseLibrary'
            });
        }

        if (!plan) {
            return res.status(404).json({ message: "No weekly plan found in database. Please run seeder." });
        }
        const planObj = plan.toObject();
        const targetBlocks = getTierTargetBlocks(planObj.philosophyName || '');
        if (targetBlocks) {
            const library = await ExerciseLibrary.find({}).select('name muscleGroup equipmentRequired icon2D_URL animationURL').lean();
            for (const day of planObj.days) {
                if (day.isRestDay) continue;
                const used = new Set((day.blocks || []).map(b => String(b?.exercise?._id || b?.exercise)));
                const ranked = [...library]
                    .filter(ex => !used.has(String(ex._id)))
                    .sort((a, b) => scoreExerciseForDay(b, day) - scoreExerciseForDay(a, day));

                while ((day.blocks?.length || 0) < targetBlocks && ranked.length > 0) {
                    const ex = ranked.shift();
                    day.blocks.push({
                        exercise: ex,
                        targetSets: planObj.philosophyName.includes('Tier 3') ? 4 : 3,
                        targetReps: planObj.philosophyName.includes('Tier 3') ? '10-12' : '12-15',
                        targetRPE: planObj.philosophyName.includes('Tier 3') ? 9 : 8,
                        restTimerSeconds: planObj.philosophyName.includes('Tier 3') ? 75 : 60
                    });
                }
            }
        }

        res.json(planObj);
    } catch (error) {
        console.error("Get Weekly Plan Error:", error);
        res.status(500).json({ message: "Failed to fetch plan", error: error.message });
    }
};

// Log a completed exercise set
exports.logWorkout = async (req, res) => {
    try {
        const userId = req.user._id;
        const { planId, sessionName, exercises = [], durationMinutes, notes } = req.body;
        if (!planId || !sessionName || !Array.isArray(exercises) || exercises.length === 0) {
            return res.status(400).json({ message: "planId, sessionName, and exercises are required" });
        }

        const { start, end } = getDayRange();
        let log = await WorkoutLog.findOne({
            user: userId,
            plan: planId,
            sessionName,
            date: { $gte: start, $lte: end }
        });

        if (!log) {
            log = new WorkoutLog({
                user: userId,
                plan: planId,
                sessionName,
                exercises: [],
                durationMinutes: durationMinutes || 0,
                notes: notes || ''
            });
        }

        // Upsert exercise sets inside the same daily session log
        for (const incoming of exercises) {
            if (!incoming?.exercise || !Array.isArray(incoming?.sets)) continue;
            const exId = incoming.exercise.toString();
            const idx = log.exercises.findIndex(e => e.exercise.toString() === exId);
            if (idx >= 0) {
                log.exercises[idx].sets = incoming.sets;
            } else {
                log.exercises.push(incoming);
            }
        }

        if (typeof durationMinutes === 'number') log.durationMinutes = durationMinutes;
        if (typeof notes === 'string') log.notes = notes;

        await log.save();

        // Progressive Overload Check Logic (simplified version)
        // In a full implementation, this analyzes the exact `sets` array vs the `targetSets/Reps`
        // and updates a unique User-Plan-Weight modifier collection.
        
        res.status(201).json({ message: "Workout logged successfully!", logId: log._id, log });
    } catch (error) {
        console.error("Log Workout Error:", error);
        res.status(500).json({ message: "Failed to log workout", error: error.message });
    }
};

// Fetch today's saved log for a given plan/session (used to restore progress state in UI)
exports.getTodayWorkoutLog = async (req, res) => {
    try {
        const userId = req.user._id;
        const { planId, sessionName } = req.query;
        if (!planId || !sessionName) {
            return res.status(400).json({ message: "planId and sessionName are required" });
        }
        const { start, end } = getDayRange();
        const log = await WorkoutLog.findOne({
            user: userId,
            plan: planId,
            sessionName,
            date: { $gte: start, $lte: end }
        }).populate('exercises.exercise', 'name muscleGroup icon2D_URL animationURL');

        res.json(log || { exercises: [], sessionName, plan: planId, date: new Date() });
    } catch (error) {
        console.error("Get Today Workout Log Error:", error);
        res.status(500).json({ message: "Failed to fetch workout log", error: error.message });
    }
};
