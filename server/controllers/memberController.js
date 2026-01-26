const User = require('../models/User');
const MetricRecord = require('../models/MetricRecord');

// Get all members
exports.getMembers = async (req, res) => {
    try {
        let selectFields = '-password';
        // Trainers cannot see mobile numbers
        if (req.user && req.user.role !== 'admin') {
            selectFields += ' -mobileNumber';
        }

        const members = await User.find({ role: 'member' })
            .select(selectFields)
            .sort({ joinedAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add new member
exports.addMember = async (req, res) => {
    try {
        const { name, email, role, ...otherData } = req.body;
        // Default password for new members added by Admin
        const user = new User({
            name,
            email,
            role: role || 'member',
            password: 'password123', // Default password
            ...otherData
        });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete member
exports.deleteMember = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Get all users (Master View)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ joinedAt: -1 }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin: Reset/Set User Password
exports.resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: `Password for ${user.email} has been reset successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get specific member profile with history (Staff only)
exports.getMemberProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const member = await User.findById(id).select('-password');

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const stats = await MetricRecord.find({ user: id }).sort({ recordedAt: -1 });

        res.json({
            profile: member,
            history: stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
