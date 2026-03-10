const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    registerGym, 
    getNearbyGyms, 
    joinGym, 
    getGymStats,
    updateFees,
    updateCoachContract,
    switchGym,
    leaveGym,
    ownerRemoveUser,
    getMyGyms
} = require('../controllers/gymController');

// Public or User-accessible discovery
router.get('/nearby', getNearbyGyms);

// Protected routes (requires login)
router.post('/register', protect, registerGym);
router.post('/:id/join', protect, joinGym);
router.post('/:id/switch', protect, switchGym);
router.post('/:id/leave', protect, leaveGym);
router.get('/my-gyms', protect, getMyGyms);
router.get('/stats', protect, getGymStats);
router.put('/fees', protect, updateFees);
router.put('/coach-contracts/:coachId', protect, updateCoachContract);
router.delete('/owner/users/:userId', protect, ownerRemoveUser);

module.exports = router;
