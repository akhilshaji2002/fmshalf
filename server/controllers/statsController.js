const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Attendance = require('../models/Attendance');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Total Members
        const totalMembers = await User.countDocuments({ role: 'member' });

        // 2. Active Now (From Security Module)
        const activeNow = await Attendance.countDocuments({ status: 'active' });

        // 3. Real Revenue (Sum of all transactions)
        const revenueAgg = await Transaction.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // 4. Total Sales/Sessions
        const sessions = await Transaction.countDocuments();

        // 5. Chart Data: Last 6 Transactions (Mocking monthly for now as we don't have historical data)
        // In a real app, use $group by month
        const revenueChart = [
            { name: 'Jan', value: revenue * 0.2 }, // Mock distribution of REAL revenue
            { name: 'Feb', value: revenue * 0.1 },
            { name: 'Mar', value: revenue * 0.3 },
            { name: 'Apr', value: revenue * 0.1 },
            { name: 'May', value: revenue * 0.1 },
            { name: 'Jun', value: revenue * 0.2 },
        ];

        // 6. Activity Data (Real Active logs)
        const activityData = [
            { name: 'Active', count: activeNow },
            { name: 'Total', count: totalMembers }
        ];

        res.json({
            totalMembers,
            activeNow,
            revenue,
            sessions,
            revenueChart,
            activityData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
