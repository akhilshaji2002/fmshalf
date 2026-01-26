const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const bcrypt = require('bcryptjs');
const aiController = require('../controllers/aiController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const memberController = require('../controllers/memberController');
const statsController = require('../controllers/statsController');
const inventoryController = require('../controllers/inventoryController');
const securityController = require('../controllers/securityController');
const authController = require('../controllers/authController');
const financeController = require('../controllers/financeController');
const testimonialController = require('../controllers/testimonialController');
const { protect, admin, trainer } = require('../middleware/authMiddleware');

// Auth
// Auth
router.post('/auth/register', authController.registerUser);
router.post('/auth/login', authController.loginUser);
router.get('/auth/profile', protect, authController.getProfile);

// Health Check
router.get('/status', (req, res) => {
    res.json({ status: 'API Operational', timestamp: new Date() });
});

// Dashboard stats (Protected)
router.get('/dashboard/stats', protect, statsController.getDashboardStats);

// Members (Protected, RBAC)
router.get('/members', protect, memberController.getMembers); // Members can likely view list or restricted list
router.post('/members', protect, trainer, memberController.addMember); // Trainers/Admins add members
router.delete('/members/:id', protect, admin, memberController.deleteMember); // Only Admin deletes
router.get('/members/:id/profile', protect, trainer, memberController.getMemberProfile); // Staff view detailed profile

// Admin Master User Management
router.get('/admin/users', protect, admin, memberController.getAllUsers);
router.post('/admin/users/:id/reset', protect, admin, memberController.resetUserPassword);

// AI (Protected)
router.post('/ai/calculate', protect, aiController.calculateHealthMetrics);
router.get('/ai/my-plan', protect, (req, res) => {
    if (req.user && req.user.dietPlan) {
        res.json({ dietPlan: req.user.dietPlan, metrics: req.user.metrics });
    } else {
        res.status(404).json({ message: 'No plan not found' });
    }
});
// New endpoint for generating progress images
router.post('/ai/progress', protect, upload.single('photo'), aiController.generateProgressImage);

// Inventory & POS (Protected, RBAC)
router.get('/inventory', protect, inventoryController.getProducts); // All members can view shop
router.post('/inventory', protect, admin, inventoryController.addProduct); // Only Admin adds stock
router.put('/inventory/:id', protect, admin, inventoryController.updateProduct); // Only Admin updates stock
router.post('/inventory/sale', protect, inventoryController.processSale); // Members can 'buy' (mock)

// Finance (Payment Gateway & Earnings)
router.post('/finance/checkout', protect, financeController.createPaymentSession);
router.post('/finance/verify', protect, financeController.verifyPayment);
router.get('/finance/earnings', protect, trainer, financeController.getTrainerEarnings);
router.get('/finance/history', protect, financeController.getTransactionHistory);

// Security (Protected)
router.get('/security/logs', protect, trainer, securityController.getAccessLogs); // Trainers/Admin view logs
router.post('/security/scan', protect, securityController.checkInMember); // Open for scanning? Or protected. Let's keep protected.

// Testimonials
router.post('/testimonials', protect, testimonialController.submitTestimonial);
router.get('/testimonials/pending', protect, trainer, testimonialController.getPendingTestimonials);
router.put('/testimonials/:id/status', protect, trainer, testimonialController.updateStatus);
router.get('/testimonials/coach/:coachId', testimonialController.getCoachTestimonials);
router.get('/testimonials', protect, admin, testimonialController.getAllTestimonials);
router.put('/testimonials/:id', protect, admin, testimonialController.adminUpdateTestimonial);
router.delete('/testimonials/:id', protect, testimonialController.deleteTestimonial);

// Bookings & Trainers
router.get('/trainers', protect, async (req, res) => {
    try {
        // Decide which fields to show based on role
        let fields = 'name email profilePic specializations experience bio';
        if (req.user.role === 'admin') {
            fields += ' nationalId';
        }

        const trainers = await User.find({ role: 'trainer' }).select(fields);
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/bookings', protect, async (req, res) => {
    try {
        const { coachId, date, coachName, trainingType } = req.body;
        const booking = await Booking.create({
            member: req.user._id,
            coach: coachId,
            coachName,
            trainingType: trainingType || 'gym',
            date
        });

        // Credit Trainer (e.g., $15 per session)
        await financeController.creditTrainer(coachId, 15);

        res.json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/bookings', protect, async (req, res) => {
    // If trainer, get their schedule. If member, get their bookings.
    const query = req.user.role === 'trainer' ? { coach: req.user._id } : { member: req.user._id };
    // Staff can see name, email, mobile, pic. Regular members only see coach info.
    const memberFields = (req.user.role === 'admin' || req.user.role === 'trainer') ? 'name email mobileNumber profilePic' : 'name email profilePic';
    const bookings = await Booking.find(query)
        .populate('member', memberFields)
        .populate('coach', 'name profilePic')
        .sort({ date: 1 });
    res.json(bookings);
});

// DEV: Seed Users
router.post('/seed', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);

        const users = [
            { name: 'Admin Boss', email: 'admin@fms.com', password: hash, role: 'admin' },
            { name: 'Coach Alex', email: 'trainer@fms.com', password: hash, role: 'trainer' },
            { name: 'Coach Sarah', email: 'sarah@fms.com', password: hash, role: 'trainer' }
        ];

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create({ ...u, password: 'password123' }); // schema handles hashing
            }
        }
        res.json({ message: 'Seeded users successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
