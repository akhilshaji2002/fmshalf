const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get recent logs
exports.getAccessLogs = async (req, res) => {
    try {
        const query = {};
        if (req.user.role !== 'admin') {
            query.gym = req.user.currentGym;
        }
        const logs = await Attendance.find(query)
            .populate('user', 'name role')
            .populate('scannedBy', 'name role')
            .sort({ checkIn: -1 })
            .limit(40);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulate QR Check-in (using Member ID)
exports.checkInMember = async (req, res) => {
    try {
        const { memberId } = req.body;
        if (!['trainer', 'admin', 'gymOwner'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized to scan attendance' });
        }

        const user = await User.findById(memberId);
        if (!user) return res.status(404).json({ error: "Member not found" });
        if (req.user.role !== 'admin') {
            if (!req.user.currentGym || !user.currentGym || String(req.user.currentGym) !== String(user.currentGym)) {
                return res.status(403).json({ error: "Member is not part of your gym" });
            }
        }

        // Check if already checked in
        const activeSession = await Attendance.findOne({ user: memberId, status: 'active' });
        if (activeSession) {
            // Checkout instead
            activeSession.checkOut = Date.now();
            activeSession.status = 'completed';
            activeSession.scannedBy = req.user._id;
            await activeSession.save();
            return res.json({ message: `Checked OUT: ${user.name}`, type: 'out', log: activeSession });
        }

        // New Check-in
        const log = new Attendance({
            user: memberId,
            gym: user.currentGym || req.user.currentGym,
            scannedBy: req.user._id
        });
        await log.save();
        res.json({ message: `Checked IN: ${user.name}`, type: 'in', log });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
