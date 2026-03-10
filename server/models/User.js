const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Added password
    role: {
        type: String,
        enum: ['member', 'trainer', 'admin', 'gymOwner'],
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
    memberProfile: {
        fitnessGoal: { type: String, default: 'general_fitness' },
        workoutPreference: { type: String, enum: ['gym', 'home', 'online', 'hybrid'], default: 'gym' },
        medicalNotes: { type: String, default: '' }
    },
    trainerProfile: {
        certifications: { type: [String], default: [] },
        hourlyRateInr: { type: Number, default: 0 },
        availableModes: { type: [String], default: ['gym'] }, // gym/home/online
        languages: { type: [String], default: [] },
        achievements: { type: String, default: '' },
        workingHours: {
            from: { type: String, default: '06:00' },
            to: { type: String, default: '20:00' }
        }
    },
    // Physical Stats (for AI/BMR)
    metrics: {
        age: { type: Number },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        weight: { type: Number }, // kg
        height: { type: Number }, // cm
        activityLevel: { type: String, default: 'moderate' },
        goals: { type: String },
        healthConditions: { type: [String], default: [] }, // e.g. ['Diabetic', 'High Cholesterol']
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
        generatedAt: { type: Date },
        // New Diet Chart Fields
        weeklyPlan: [{
            day: { type: String }, // e.g. "Monday" or "Day 1"
            meals: [{
                name: { type: String }, // "Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner"
                description: { type: String }, // Food item(s)
                calories: { type: Number },
                macros: {
                    p: { type: Number },
                    f: { type: Number },
                    c: { type: Number }
                }
            }]
        }],
        groceryList: { type: [String], default: [] },
        hydrationTarget: { type: String, default: "3-4 Liters" },
        plateMethod: { type: String, default: "50% Veggies, 25% Protein, 25% Carbs" }
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
    isApproved: { type: Boolean, default: false }, // For Trainers/GymOwners
    
    // Chat Tracking for Unread Messages
    lastReadCommunity: { type: Date, default: Date.now },
    lastReadCoachesGroup: { type: Date, default: Date.now },

    wallet: {
        balance: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    subscription: {
        status: {
            type: String,
            enum: ['none', 'active', 'expired', 'pending'],
            default: 'none'
        },
        planType: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly'],
            default: 'monthly'
        },
        startedAt: { type: Date },
        expiresAt: { type: Date },
        lastPaymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
    },
    affiliations: [{
        gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
        roleInGym: { type: String, enum: ['member', 'trainer', 'gymOwner'], required: true },
        membership: {
            status: { type: String, enum: ['none', 'active', 'expired', 'pending'], default: 'none' },
            packageType: { type: String, default: 'monthly' },
            startedAt: { type: Date },
            expiresAt: { type: Date },
            workoutTime: { type: String, default: '' },
            planAmountInr: { type: Number, default: 0 }
        },
        joinedAt: { type: Date, default: Date.now }
    }],
    // Reference to the gym the user joined (for members/coaches) or owns (gymOwner)
    currentGym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym'
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
