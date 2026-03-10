const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, ...otherData } = req.body;
        console.log(`[AUTH] Registering user: ${email}`);

        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log(`[AUTH] Registration failed: User ${email} already exists`);
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role, ...otherData });

        if (user) {
            console.log(`[AUTH] User created: ${user._id}`);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentGym: user.currentGym || null,
                affiliations: user.affiliations || [],
                mobileNumber: user.mobileNumber,
                profilePic: user.profilePic,
                experience: user.experience,
                specializations: user.specializations,
                bio: user.bio,
                nationalId: user.nationalId,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(`[AUTH] Registration Error:`, error);
        res.status(500).json({ message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt: ${email}`);

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            console.log(`[AUTH] Login success: ${email}`);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentGym: user.currentGym || null,
                affiliations: user.affiliations || [],
                profilePic: user.profilePic,
                experience: user.experience,
                specializations: user.specializations,
                bio: user.bio,
                nationalId: user.nationalId,
                token: generateToken(user._id)
            });
        } else {
            console.log(`[AUTH] Login failed: Invalid credentials for ${email}`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(`[AUTH] Login Error:`, error);
        res.status(500).json({ message: error.message });
    }
};

// Get Current User Profile (with History)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentGym: user.currentGym || null,
                affiliations: user.affiliations || [],
                subscription: user.subscription || { status: 'none' },
                generatedImages: user.generatedImages || []
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
