const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
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
const gymRoutes = require('./gymRoutes');
const chatRoutes = require('./chatRoutes');
const kinetixRoutes = require('./kinetixRoutes');
const mongoose = require('mongoose');

// Mount complex routers
// Keep both aliases for backward compatibility.
router.use('/gym', gymRoutes);
router.use('/gyms', gymRoutes);
router.use('/chat', chatRoutes);
router.use('/kinetix', kinetixRoutes);

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
        res.status(404).json({ message: 'No plan found' });
    }
});
// New endpoint for generating progress images
router.post('/ai/progress', protect, upload.single('photo'), aiController.generateProgressImage);
router.delete('/ai/progress', protect, aiController.deleteProgressImage);

// New endpoint for Food Vision
router.post('/ai/analyze-food', protect, upload.single('image'), aiController.analyzeFood);

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
router.get('/security/logs', protect, securityController.getAccessLogs);
router.post('/security/scan', protect, securityController.checkInMember);

// Testimonials
router.post('/testimonials', protect, testimonialController.submitTestimonial);
router.get('/testimonials/public', testimonialController.getPublicStories);
router.get('/testimonials/mine', protect, testimonialController.getMyTestimonials);
router.get('/testimonials/pending', protect, trainer, testimonialController.getPendingTestimonials);
router.put('/testimonials/:id/status', protect, trainer, testimonialController.updateStatus);
router.get('/testimonials/coach/:coachId', testimonialController.getCoachTestimonials);
router.get('/testimonials/coach/:coachId/summary', testimonialController.getCoachReviewSummary);
router.get('/testimonials/gym/:gymId/summary', testimonialController.getGymReviewSummary);
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
        const trainingType = String(req.query.trainingType || 'gym').toLowerCase();
        const query = { role: 'trainer' };
        if (req.user.role !== 'admin' && trainingType !== 'online') {
            if (!req.user.currentGym) {
                return res.json([]);
            }
            query.$or = [
                { currentGym: req.user.currentGym },
                { affiliations: { $elemMatch: { gym: req.user.currentGym, roleInGym: 'trainer' } } }
            ];
        }
        const trainers = await User.find(query).select(`${fields} currentGym affiliations`).lean();
        const mapped = trainers.map((t) => {
            const sameByCurrent = req.user.currentGym && String(t.currentGym || '') === String(req.user.currentGym);
            const sameByAff = Array.isArray(t.affiliations)
                && t.affiliations.some((a) => a.roleInGym === 'trainer' && req.user.currentGym && String(a.gym) === String(req.user.currentGym));
            return {
                ...t,
                canInGymBooking: Boolean(sameByCurrent || sameByAff)
            };
        });
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/bookings', protect, async (req, res) => {
    try {
        const { coachId, date, coachName, trainingType } = req.body;
        const normalizedType = ['gym', 'home', 'online'].includes(trainingType) ? trainingType : 'gym';
        if (!coachId || !date) {
            return res.status(400).json({ message: 'coachId and date are required' });
        }
        if (!mongoose.Types.ObjectId.isValid(String(coachId))) {
            return res.status(400).json({ message: 'Invalid coachId' });
        }
        const coach = await User.findById(coachId).select('name role currentGym affiliations');
        if (!coach || !['trainer', 'admin', 'gymOwner'].includes(coach.role)) {
            return res.status(400).json({ message: 'Selected coach is not available for booking' });
        }
        if (normalizedType !== 'online') {
            if (!req.user.currentGym) {
                return res.status(400).json({ message: 'Join a gym before booking gym/home sessions' });
            }
            const coachInGym = String(coach.currentGym || '') === String(req.user.currentGym)
                || (Array.isArray(coach.affiliations) && coach.affiliations.some((a) => String(a.gym) === String(req.user.currentGym) && a.roleInGym === 'trainer'));
            if (!coachInGym) {
                return res.status(400).json({ message: 'For gym/home sessions, coach must be from your gym' });
            }
        }
        const bookingDate = new Date(date);
        if (Number.isNaN(bookingDate.getTime())) {
            return res.status(400).json({ message: 'Invalid booking date' });
        }

        const Gym = require('../models/Gym');
        const gym = req.user.currentGym ? await Gym.findById(req.user.currentGym).select('monthlyFee coachContracts') : null;
        const contract = gym?.coachContracts?.find((c) => String(c.coach) === String(coachId));
        const salaryPerSession = Number(contract?.salaryPerSession || 15);
        const sessionFee = normalizedType === 'online'
            ? salaryPerSession
            : Number(gym?.monthlyFee || salaryPerSession);

        const booking = await Booking.create({
            member: req.user._id,
            coach: coachId,
            coachName: coachName || coach.name,
            gym: req.user.currentGym || coach.currentGym,
            trainingType: normalizedType,
            date: bookingDate,
            fee: sessionFee,
            salaryPerSession
        });

        // Credit Trainer (e.g., $15 per session)
        await financeController.creditTrainer(coachId, salaryPerSession, {
            gymId: req.user.currentGym || coach.currentGym,
            bookingId: booking._id,
            trainingType: normalizedType,
            paidBy: req.user._id
        });

        res.json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/bookings', protect, async (req, res) => {
    try {
        // Admin can view all bookings, trainers view own schedule, members view own bookings.
        const query = req.user.role === 'admin'
            ? {}
            : req.user.role === 'trainer'
                ? { coach: req.user._id }
                : req.user.role === 'gymOwner'
                    ? { gym: req.user.currentGym }
                : { member: req.user._id };
        if (req.user.role === 'gymOwner' && req.user.currentGym) {
            query.gym = req.user.currentGym;
        }
        // Staff can see name, email, mobile, pic. Members only see coach info.
        const memberFields = (req.user.role === 'admin' || req.user.role === 'trainer')
            ? 'name email mobileNumber profilePic'
            : 'name email profilePic';
        const bookings = await Booking.find(query)
            .populate('member', memberFields)
            .populate('coach', 'name profilePic role')
            .populate('gym', 'name')
            .sort({ date: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DEV: Seed Users
router.post('/seed', async (req, res) => {
    try {
        const users = [
            { name: 'Admin Boss', email: 'admin@fms.com', password: 'password123', role: 'admin' },
            { name: 'Coach Alex', email: 'trainer@fms.com', password: 'password123', role: 'trainer' },
            { name: 'Coach Sarah', email: 'sarah@fms.com', password: 'password123', role: 'trainer' }
        ];

        for (const u of users) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u); // schema handles hashing
            }
        }
        res.json({ message: 'Seeded users successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
