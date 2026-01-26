const Testimonial = require('../models/Testimonial');
const User = require('../models/User');

// @desc    Submit a new testimonial
// @route   POST /api/testimonials
// @access  Private (Member)
const submitTestimonial = async (req, res) => {
    try {
        const { coachId, content, transformationImage, achievement } = req.body;

        const coach = await User.findById(coachId);
        if (!coach || coach.role !== 'trainer') {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        const testimonial = await Testimonial.create({
            member: req.user._id,
            coach: coachId,
            content,
            transformationImage,
            achievement
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
        }).populate('member', 'name profilePic');

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
            .populate('coach', 'name');

        res.json(testimonials);
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
    getAllTestimonials
};
