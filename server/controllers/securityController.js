const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get recent logs
exports.getAccessLogs = async (req, res) => {
    try {
        const logs = await Attendance.find().populate('user', 'name role').sort({ checkIn: -1 }).limit(20);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulate QR Check-in (using Member ID)
exports.checkInMember = async (req, res) => {
    try {
        const { memberId } = req.body;

        const user = await User.findById(memberId);
        if (!user) return res.status(404).json({ error: "Member not found" });

        // Check if already checked in
        const activeSession = await Attendance.findOne({ user: memberId, status: 'active' });
        if (activeSession) {
            // Checkout instead
            activeSession.checkOut = Date.now();
            activeSession.status = 'completed';
            await activeSession.save();
            return res.json({ message: `Checked OUT: ${user.name}`, type: 'out', log: activeSession });
        }

        // New Check-in
        const log = new Attendance({ user: memberId });
        await log.save();
        res.json({ message: `Checked IN: ${user.name}`, type: 'in', log });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
