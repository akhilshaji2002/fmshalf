const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Gym = require('../models/Gym');

// Fetch chat history for "community", "coaches_group", or 1-1 by user ID
exports.getChatHistory = async (req, res) => {
    try {
        const { targetId } = req.params;
        const currentUserId = req.user._id;
        const isMember = req.user.role === 'member';

        let messages;
        if (targetId === 'community') {
            // Global community only — include legacy null receiver docs for backward compatibility
            messages = await Message.find({ $or: [{ receiver: 'community' }, { receiver: null }, { receiver: { $exists: false } }] })
                .populate('sender', 'name profilePic role')
                .sort({ createdAt: 1 })
                .limit(200);
            await User.findByIdAndUpdate(currentUserId, { lastReadCommunity: Date.now() });
        } else if (targetId === 'coaches_group') {
            // Members should use direct 1-1 coach chat, not the coaches broadcast room
            if (req.user.role === 'member') {
                return res.status(403).json({ message: "Members cannot access coaches group chat" });
            }
            // Private coaches channel only
            messages = await Message.find({ receiver: 'coaches_group' })
                .populate('sender', 'name profilePic role')
                .sort({ createdAt: 1 })
                .limit(200);
            await User.findByIdAndUpdate(currentUserId, { lastReadCoachesGroup: Date.now() });
        } else {
            // 1-on-1: normalize to ObjectId so DB comparison is consistent
            let targetObjId;
            try {
                targetObjId = new mongoose.Types.ObjectId(targetId);
            } catch (_) {
                return res.status(400).json({ message: "Invalid chat target" });
            }

            // Strict member lock: member can only open DM with assigned coach
            if (isMember) {
                const targetUser = await User.findById(targetObjId).select('role currentGym');
                if (!targetUser) {
                    return res.status(404).json({ message: 'Target user not found' });
                }
                const latestBooking = await Booking.findOne({
                    member: currentUserId,
                    status: { $ne: 'cancelled' }
                }).sort({ date: -1, createdAt: -1 });
                const isAssignedCoach = latestBooking?.coach && latestBooking.coach.toString() === targetObjId.toString();
                const isSameGymOwner = targetUser.role === 'gymOwner'
                    && req.user.currentGym
                    && targetUser.currentGym
                    && String(targetUser.currentGym) === String(req.user.currentGym);
                if (!isAssignedCoach && !isSameGymOwner) {
                    return res.status(403).json({ message: "You can only chat with your assigned coach" });
                }
            }

            messages = await Message.find({
                $or: [
                    // Current normalized shape
                    { sender: currentUserId, receiver: targetObjId },
                    { sender: targetObjId, receiver: currentUserId },
                    // Backward compatibility for previously mixed string/ObjectId storage
                    { sender: currentUserId, receiver: targetId },
                    { sender: targetObjId, receiver: currentUserId.toString() },
                    { sender: currentUserId.toString(), receiver: targetObjId },
                    { sender: targetId, receiver: currentUserId }
                ]
            })
                .populate('sender', 'name profilePic role')
                .sort({ createdAt: 1 })
                .limit(200);
            await Message.updateMany(
                {
                    $or: [
                        { sender: targetObjId, receiver: currentUserId, isRead: false },
                        { sender: targetId, receiver: currentUserId, isRead: false },
                        { sender: targetObjId, receiver: currentUserId.toString(), isRead: false },
                        { sender: targetId, receiver: currentUserId.toString(), isRead: false }
                    ]
                },
                { $set: { isRead: true } }
            );
        }

        res.json(messages);
    } catch (error) {
        console.error("Chat History Error:", error);
        res.status(500).json({ message: "Failed to fetch chat history", error: error.message });
    }
};

// Fetch list of users for the chat sidebar
exports.getContacts = async (req, res) => {
    try {
        // Member sees all coaches/admins; assigned coach appears first.
        if (req.user.role === 'member') {
            const latestBooking = await Booking.findOne({
                member: req.user._id,
                status: { $ne: 'cancelled' }
            }).sort({ date: -1, createdAt: -1 });

            const gym = req.user.currentGym ? await Gym.findById(req.user.currentGym).select('ownerId coaches') : null;
            const sameGymCoachIds = gym?.coaches || [];
            const sameGymOwnerId = gym?.ownerId ? [gym.ownerId] : [];
            const onlineCoachId = latestBooking?.trainingType === 'online' && latestBooking?.coach ? [latestBooking.coach] : [];
            const targetIds = [...sameGymCoachIds, ...sameGymOwnerId, ...onlineCoachId]
                .map((id) => String(id))
                .filter((v, i, arr) => arr.indexOf(v) === i);

            const staff = await User.find({
                _id: { $in: targetIds, $ne: req.user._id },
                role: { $in: ['trainer', 'gymOwner'] }
            })
                .select('name role profilePic')
                .sort({ role: 1, name: 1 })
                .lean();

            const assignedId = latestBooking?.coach ? latestBooking.coach.toString() : null;
            const withAssigned = staff.map(u => ({ ...u, isAssignedCoach: assignedId ? u._id.toString() === assignedId : false }));
            withAssigned.sort((a, b) => Number(b.isAssignedCoach) - Number(a.isAssignedCoach));
            return res.json(withAssigned);
        }

        const query = { _id: { $ne: req.user._id } };
        if (req.user.role === 'trainer' || req.user.role === 'gymOwner') {
            query.currentGym = req.user.currentGym;
        }
        const users = await User.find(query)
            .select('name role profilePic')
            .sort({ role: 1, name: 1 });
        res.json(users);
    } catch (error) {
        console.error("Get Contacts Error:", error);
        res.status(500).json({ message: "Failed to fetch contacts", error: error.message });
    }
};

// Handle media upload for chat
exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // multer saves it in `/uploads/`
        const mediaUrl = `/uploads/${req.file.filename}`;
        
        // Determine type based on mimetype
        let mediaType = 'none';
        if (req.file.mimetype.startsWith('image/')) mediaType = 'image';
        else if (req.file.mimetype.startsWith('video/')) mediaType = 'video';
        else if (req.file.mimetype.startsWith('audio/')) mediaType = 'audio';

        res.json({ mediaUrl, mediaType });
    } catch (error) {
        console.error("Media Upload Error:", error);
        res.status(500).json({ message: "Failed to upload media", error: error.message });
    }
};

// Get Unread Counts for all chats
exports.getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const unreadCounts = {};

        // 1. Community Unread Count (Global) — only messages explicitly to community
        const communityCount = await Message.countDocuments({
            $or: [{ receiver: 'community' }, { receiver: null }, { receiver: { $exists: false } }],
            sender: { $ne: userId },
            createdAt: { $gt: user.lastReadCommunity || new Date(0) }
        });
        if (communityCount > 0) unreadCounts['community'] = communityCount;

        // 2. Coaches Group Unread (staff only)
        if (['admin', 'trainer', 'gymOwner'].includes(user.role)) {
            const coachesCount = await Message.countDocuments({
                receiver: 'coaches_group',
                sender: { $ne: userId },
                createdAt: { $gt: user.lastReadCoachesGroup || new Date(0) }
            });
            if (coachesCount > 0) unreadCounts['coaches_group'] = coachesCount;
        }

        // 3. 1-on-1 DB Aggregation (Messages sent TO me, that are isRead = false)
        const dmUnreadAgg = await Message.aggregate([
            {
                $match: {
                    $or: [{ receiver: userId }, { receiver: userId.toString() }],
                    isRead: false
                }
            },
            { $group: { _id: "$sender", count: { $sum: 1 } } }
        ]);

        dmUnreadAgg.forEach(item => {
            unreadCounts[item._id.toString()] = item.count;
        });

        res.json(unreadCounts);
    } catch (error) {
        console.error("Get Unread Counts Error:", error);
        res.status(500).json({ message: "Failed to fetch unread counts", error: error.message });
    }
};

// Mark a specific chat as read
exports.markChatRead = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user._id;

        if (type === 'community') {
            await User.findByIdAndUpdate(userId, { lastReadCommunity: Date.now() });
        } else if (type === 'coaches_group') {
            await User.findByIdAndUpdate(userId, { lastReadCoachesGroup: Date.now() });
        } else if (type === 'user') {
            // Mark all messages from this specific user TO me as read
            await Message.updateMany(
                {
                    $or: [
                        { sender: id, receiver: userId, isRead: false },
                        { sender: id, receiver: userId.toString(), isRead: false }
                    ]
                },
                { $set: { isRead: true } }
            );
        }

        res.json({ message: "Chat marked as read" });
    } catch (error) {
        console.error("Mark Chat Read Error:", error);
        res.status(500).json({ message: "Failed to mark chat as read", error: error.message });
    }
};
