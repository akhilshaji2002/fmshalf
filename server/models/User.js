const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Added password
    role: {
        type: String,
        enum: ['member', 'trainer', 'admin'],
        default: 'member'
    },
    mobileNumber: { type: String, default: '' },
    // Enhanced Profile Data (Mainly for Coaches)
    profilePic: { type: String, default: '' },
    nationalId: {
        idType: { type: String, enum: ['aadhar', 'voter', 'license', 'other'], default: 'other' },
        idNumber: { type: String, default: '' }
    },
    experience: { type: String, default: '0' }, // Years
    specializations: { type: [String], default: [] }, // e.g. ['Cardio', 'Weight Gain', 'Bodybuilding']
    bio: { type: String, default: '' },
    // Physical Stats (for AI/BMR)
    metrics: {
        age: { type: Number },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        weight: { type: Number }, // kg
        height: { type: Number }, // cm
        activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
        bmr: { type: Number },
        tdee: { type: Number }
    },
    // AI Generated Plan
    dietPlan: {
        calories: { type: Number },
        macros: {
            protein: { type: Number },
            fats: { type: Number },
            carbs: { type: Number }
        },
        suggestion: { type: String },
        generatedAt: { type: Date }
    },
    // AI Progress History
    generatedImages: [{
        imageUrl: { type: String },
        prompt: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    // Health Data (Mock Wearable Integration)
    healthData: {
        heartRate: { type: Number, default: 0 },
        steps: { type: Number, default: 0 },
        sleepHours: { type: Number, default: 0 }
    },
    wallet: {
        balance: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    joinedAt: { type: Date, default: Date.now }
});

// Encrypt password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
