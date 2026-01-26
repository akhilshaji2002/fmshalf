const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
    coachName: { type: String }, // Cache for display
    trainingType: {
        type: String,
        enum: ['gym', 'home', 'online'],
        default: 'gym'
    },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed' // Auto-confirm for now
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
