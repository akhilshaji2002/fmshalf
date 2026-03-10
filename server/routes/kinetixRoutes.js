const express = require('express');
const router = express.Router();
const kinetixController = require('../controllers/kinetixController');
const { protect } = require('../middleware/authMiddleware');

// Fetch the user's weekly workout plan
router.get('/plan', protect, kinetixController.getWeeklyPlan);

// Log an active workout session
router.post('/log', protect, kinetixController.logWorkout);
router.get('/log/today', protect, kinetixController.getTodayWorkoutLog);

module.exports = router;
