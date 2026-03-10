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
    gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
    },
    trainingType: {
        type: String,
        enum: ['gym', 'home', 'online'],
        default: 'gym'
    },
    fee: { type: Number, default: 0 },
    salaryPerSession: { type: Number, default: 15 },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed' // Auto-confirm for now
    },
    sessionStatus: {
        type: String,
        enum: ['scheduled', 'completed', 'missed'],
        default: 'scheduled'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
