const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
    },
    content: {
        type: String,
        required: true
    },
    coachReview: { type: String, default: '' },
    gymReview: { type: String, default: '' },
    coachRating: { type: Number, min: 1, max: 5, default: 5 },
    gymRating: { type: Number, min: 1, max: 5, default: 5 },
    transformationImage: {
        type: String,
        default: ''
    },
    beforeImage: {
        type: String,
        required: true
    },
    afterImage: {
        type: String,
        required: true
    },
    achievement: {
        type: String, // e.g., "Lost 20kg", "Benched 100kg"
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
