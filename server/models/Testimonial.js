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
    content: {
        type: String,
        required: true
    },
    transformationImage: {
        type: String,
        required: true
    },
    achievement: {
        type: String, // e.g., "Lost 20kg", "Benched 100kg"
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
