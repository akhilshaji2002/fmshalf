const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    name: { type: String, required: true },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    location: {
        address: { type: String },
        lat: { type: Number },
        lng: { type: Number }
    },
    placeId: { type: String }, // Google Maps Place ID if applicable
    admissionFee: { type: Number, default: 0 },
    monthlyFee: { type: Number, default: 0 },
    // Google Maps data caching (or direct storage if no API used)
    images: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    reviews: [{
        author: String,
        text: String,
        rating: Number,
        date: Date
    }],
    facilities: { type: [String], default: [] },
    contactNumber: { type: String },
    
    // relationships
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    coaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    coachContracts: [{
        coach: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        salaryPerSession: { type: Number, default: 15 },
        hourlyRate: { type: Number, default: 0 },
        workingHours: {
            from: { type: String, default: '07:00' },
            to: { type: String, default: '19:00' }
        }
    }],
    
    // Financial Tracking for Owner
    financialStatus: {
        totalEarnings: { type: Number, default: 0 },
        pendingDues: { type: Number, default: 0 }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gym', gymSchema);
