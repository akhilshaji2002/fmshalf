const Testimonial = require('../models/Testimonial');
const User = require('../models/User');

// @desc    Submit a new testimonial
// @route   POST /api/testimonials
// @access  Private (Member)
const submitTestimonial = async (req, res) => {
    try {
        const { coachId, content, transformationImage, beforeImage, afterImage, achievement, coachRating, gymRating, coachReview, gymReview } = req.body;

        const coach = await User.findById(coachId);
        if (!coach || coach.role !== 'trainer') {
            return res.status(404).json({ message: 'Trainer not found' });
        }
        const bImg = beforeImage || transformationImage;
        const aImg = afterImage || transformationImage;
        if (!bImg || !aImg) {
            return res.status(400).json({ message: 'Before and after images are required' });
        }

        const testimonial = await Testimonial.create({
            member: req.user._id,
            coach: coachId,
            gym: req.user.currentGym || null,
            content,
            transformationImage: aImg,
            beforeImage: bImg,
            afterImage: aImg,
            achievement,
            coachRating: Number(coachRating || 5),
            gymRating: Number(gymRating || 5),
            coachReview: coachReview || '',
            gymReview: gymReview || ''
        });

        res.status(201).json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending testimonials for a coach
// @route   GET /api/testimonials/pending
// @access  Private (Trainer)
const getPendingTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({
            coach: req.user._id,
            status: 'pending'
        }).populate('member', 'name profilePic');

        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update testimonial status (Approve/Reject)
// @route   PUT /api/testimonials/:id/status
// @access  Private (Trainer)
const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        // Check if the user is the assigned coach
        if (testimonial.coach.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        testimonial.status = status;
        await testimonial.save();

        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get approved testimonials for a coach
// @route   GET /api/testimonials/coach/:coachId
// @access  Public
const getCoachTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({
            coach: req.params.coachId,
            status: 'approved'
        })
            .populate('member', 'name profilePic')
            .populate('gym', 'name');

        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
const adminUpdateTestimonial = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin/Member)
const deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        // Only Admin or the Member who created it can delete
        if (req.user.role !== 'admin' && testimonial.member.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await testimonial.deleteOne();
        res.json({ message: 'Testimonial removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all testimonials (Admin)
// @route   GET /api/testimonials
// @access  Private (Admin)
const getAllTestimonials = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        const testimonials = await Testimonial.find()
            .populate('member', 'name email')
            .populate('coach', 'name')
            .populate('gym', 'name');

        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Public approved stories for all roles
const getPublicStories = async (req, res) => {
    try {
        const stories = await Testimonial.find({ status: 'approved' })
            .populate('member', 'name profilePic')
            .populate('coach', 'name')
            .populate('gym', 'name')
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Logged-in user's testimonials (any status)
const getMyTestimonials = async (req, res) => {
    try {
        const stories = await Testimonial.find({ member: req.user._id })
            .populate('member', 'name profilePic')
            .populate('coach', 'name')
            .populate('gym', 'name')
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Rating summary for a coach
const getCoachReviewSummary = async (req, res) => {
    try {
        const coachId = req.params.coachId;
        const rows = await Testimonial.find({ coach: coachId, status: 'approved' })
            .select('coachRating coachReview member')
            .populate('member', 'name profilePic')
            .sort({ createdAt: -1 })
            .limit(10);
        if (!rows.length) {
            return res.json({ average: 0, count: 0, reviews: [] });
        }
        const avg = rows.reduce((s, r) => s + Number(r.coachRating || 0), 0) / rows.length;
        res.json({
            average: Number(avg.toFixed(2)),
            count: rows.length,
            reviews: rows
                .filter((r) => r.coachReview)
                .map((r) => ({ rating: r.coachRating, review: r.coachReview, member: r.member }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Rating summary for a gym
const getGymReviewSummary = async (req, res) => {
    try {
        const gymId = req.params.gymId;
        const rows = await Testimonial.find({ gym: gymId, status: 'approved' })
            .select('gymRating gymReview member coach')
            .populate('member', 'name profilePic')
            .populate('coach', 'name')
            .sort({ createdAt: -1 })
            .limit(20);
        if (!rows.length) {
            return res.json({ average: 0, count: 0, reviews: [] });
        }
        const avg = rows.reduce((s, r) => s + Number(r.gymRating || 0), 0) / rows.length;
        res.json({
            average: Number(avg.toFixed(2)),
            count: rows.length,
            reviews: rows
                .filter((r) => r.gymReview)
                .map((r) => ({ rating: r.gymRating, review: r.gymReview, member: r.member, coach: r.coach }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitTestimonial,
    getPendingTestimonials,
    updateStatus,
    getCoachTestimonials,
    adminUpdateTestimonial,
    deleteTestimonial,
    getAllTestimonials,
    getPublicStories,
    getMyTestimonials,
    getCoachReviewSummary,
    getGymReviewSummary
};
