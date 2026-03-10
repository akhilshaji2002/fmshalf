const Gym = require('../models/Gym');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Attendance = require('../models/Attendance');
const pickNextGym = (user, removedGymId) => {
    const next = (user.affiliations || []).find((a) => String(a.gym) !== String(removedGymId));
    return next ? next.gym : null;
};
const getPackageDays = (pkg) => {
    if (pkg === 'daily') return 1;
    if (pkg === 'quarterly') return 90;
    if (pkg === 'six_month') return 180;
    if (pkg === 'yearly') return 365;
    return 30;
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Register a new Gym
exports.registerGym = async (req, res) => {
    try {
        const { name, location, admissionFee, monthlyFee, facilities, contactNumber } = req.body;
        
        // Ensure user is a gym Owner
        if (req.user.role !== 'gymOwner') {
            return res.status(403).json({ message: 'Only Gym Owners can register a gym' });
        }

        // Check if owner already has a gym
        const existingGym = await Gym.findOne({ ownerId: req.user._id });
        if (existingGym) {
            return res.status(400).json({ message: 'You already have a registered gym' });
        }

        const gym = await Gym.create({
            name,
            ownerId: req.user._id,
            location,
            admissionFee: admissionFee || 0,
            monthlyFee: monthlyFee || 0,
            facilities: facilities || [],
            contactNumber
        });

        // Update user's currentGym
        await User.findByIdAndUpdate(req.user._id, { currentGym: gym._id });

        res.status(201).json(gym);
    } catch (error) {
        console.error('[GYM] Registration Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get nearby gyms (mocked Google Maps data combined with db gyms)
exports.getNearbyGyms = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        // In a real scenario, we would call the Google Maps Places API here
        // and merge it with our database Gyms.
        // For now, we'll return all registered gyms in our DB, and some mock ones.

        const dbGyms = await Gym.find().populate('ownerId', 'name email');
        const qLat = Number(lat);
        const qLng = Number(lng);
        const withDistance = dbGyms.map((gym) => {
            const payload = gym.toObject();
            if (
                Number.isFinite(qLat)
                && Number.isFinite(qLng)
                && Number.isFinite(payload?.location?.lat)
                && Number.isFinite(payload?.location?.lng)
            ) {
                payload.distanceKm = Number(haversineKm(qLat, qLng, payload.location.lat, payload.location.lng).toFixed(2));
            } else {
                payload.distanceKm = null;
            }
            return payload;
        }).sort((a, b) => {
            if (a.distanceKm == null) return 1;
            if (b.distanceKm == null) return -1;
            return a.distanceKm - b.distanceKm;
        });
        
        // Return structured data for the frontend
        res.json({
            success: true,
            data: withDistance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Join a gym (for members and coaches)
exports.joinGym = async (req, res) => {
    try {
        const gymId = req.params.id;
        const gym = await Gym.findById(gymId);
        
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Add user to gym's member or coach list
        if (req.user.role === 'member') {
            if (!gym.members.includes(req.user._id)) {
                gym.members.push(req.user._id);
                // Simple financial calculation: add admission fee to totalEarnings
                gym.financialStatus.totalEarnings += gym.admissionFee;
            }
        } else if (req.user.role === 'trainer') {
            if (!gym.coaches.includes(req.user._id)) {
                gym.coaches.push(req.user._id);
            }
        }

        await gym.save();

        // Update user current gym + affiliation (supports multi-gym role assignment)
        const user = await User.findById(req.user._id);
        if (user) {
            const roleInGym = req.user.role === 'trainer' ? 'trainer' : (req.user.role === 'gymOwner' ? 'gymOwner' : 'member');
            const existing = (user.affiliations || []).find((a) => String(a.gym) === String(gym._id) && a.roleInGym === roleInGym);
            if (!existing) {
                user.affiliations.push({
                    gym: gym._id,
                    roleInGym,
                    membership: roleInGym === 'member'
                        ? { status: 'pending', packageType: 'monthly' }
                        : { status: 'active', packageType: 'staff' }
                });
            }
            user.currentGym = gym._id;
            await user.save();
        }

        res.json({ message: 'Successfully joined the gym', gym });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Switch active gym for users already affiliated with multiple gyms
exports.switchGym = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const hasAffiliation = (user.affiliations || []).some((a) => String(a.gym) === String(id));
        if (!hasAffiliation && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not associated with this gym' });
        }
        user.currentGym = id;
        await user.save();
        res.json({ message: 'Active gym switched', currentGym: id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all gyms associated with the logged-in member/trainer
exports.getMyGyms = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('affiliations.gym', 'name location monthlyFee admissionFee facilities contactNumber');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const gyms = (user.affiliations || [])
            .filter((a) => a.gym)
            .map((a) => {
                const startedAt = a.membership?.startedAt ? new Date(a.membership.startedAt) : (a.joinedAt ? new Date(a.joinedAt) : null);
                const expiresAt = a.membership?.expiresAt
                    ? new Date(a.membership.expiresAt)
                    : (startedAt ? new Date(startedAt.getTime() + (getPackageDays(a.membership?.packageType) * 24 * 60 * 60 * 1000)) : null);
                const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now) / oneDayMs) : null;
                const monthly = Number(a.gym.monthlyFee || 0);
                const renewalBase = {
                    daily: 100,
                    monthly,
                    quarterly: monthly * 3,
                    six_month: monthly * 6,
                    yearly: monthly * 12
                };
                const renewalOptions = Object.entries(renewalBase).reduce((acc, [k, amount]) => {
                    const discounted = ['quarterly', 'six_month', 'yearly'].includes(k) ? Math.round(amount * 0.9) : Math.round(amount);
                    acc[k] = {
                        amountInr: discounted,
                        discountPercent: ['quarterly', 'six_month', 'yearly'].includes(k) ? 10 : 0
                    };
                    return acc;
                }, {});
                return {
                    gym: a.gym,
                    roleInGym: a.roleInGym,
                    joinedAt: a.joinedAt,
                    isActiveGym: String(user.currentGym || '') === String(a.gym._id),
                    membership: {
                        status: a.membership?.status || 'none',
                        packageType: a.membership?.packageType || 'monthly',
                        startedAt: startedAt || null,
                        expiresAt,
                        daysLeft,
                        workoutTime: a.membership?.workoutTime || '',
                        planAmountInr: a.membership?.planAmountInr || 0
                    },
                    renewalOptions
                };
            });

        res.json({
            currentGym: user.currentGym || null,
            gyms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Leave gym for trainer/member
exports.leaveGym = async (req, res) => {
    try {
        const { id } = req.params;
        const gym = await Gym.findById(id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.user.role === 'member') {
            gym.members = gym.members.filter((m) => String(m) !== String(user._id));
        } else if (req.user.role === 'trainer') {
            gym.coaches = gym.coaches.filter((c) => String(c) !== String(user._id));
            gym.coachContracts = (gym.coachContracts || []).filter((cc) => String(cc.coach) !== String(user._id));
        } else {
            return res.status(403).json({ message: 'Only member/trainer can leave a gym' });
        }

        user.affiliations = (user.affiliations || []).filter((a) => String(a.gym) !== String(id));
        if (String(user.currentGym || '') === String(id)) {
            user.currentGym = pickNextGym(user, id);
        }

        await Promise.all([gym.save(), user.save()]);
        res.json({ message: 'Left gym successfully', currentGym: user.currentGym || null, affiliations: user.affiliations || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Gym owner removes member/trainer from their gym
exports.ownerRemoveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const gym = await Gym.findOne({ ownerId: req.user._id });
        if (!gym) return res.status(404).json({ message: 'Gym not found' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const wasMember = gym.members.some((m) => String(m) === String(userId));
        const wasCoach = gym.coaches.some((c) => String(c) === String(userId));
        if (!wasMember && !wasCoach) {
            return res.status(400).json({ message: 'User is not attached to your gym' });
        }

        gym.members = gym.members.filter((m) => String(m) !== String(userId));
        gym.coaches = gym.coaches.filter((c) => String(c) !== String(userId));
        gym.coachContracts = (gym.coachContracts || []).filter((cc) => String(cc.coach) !== String(userId));
        user.affiliations = (user.affiliations || []).filter((a) => String(a.gym) !== String(gym._id));
        if (String(user.currentGym || '') === String(gym._id)) {
            user.currentGym = pickNextGym(user, gym._id);
        }

        await Promise.all([gym.save(), user.save()]);
        res.json({ message: 'User removed from gym' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get gym dashboard stats (for owner)
exports.getGymStats = async (req, res) => {
    try {
        const gym = await Gym.findOne({ ownerId: req.user._id })
            .populate('members', 'name email joinedAt profilePic subscription')
            .populate('coaches', 'name email specializations profilePic');

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found for this owner' });
        }

        const gymId = gym._id;
        const [transactions, activeAttendance, todayAttendance] = await Promise.all([
            Transaction.find({ gym: gymId, status: 'completed' }).sort({ date: -1 }).limit(50),
            Attendance.countDocuments({ gym: gymId, status: 'active' }),
            Attendance.countDocuments({
                gym: gymId,
                checkIn: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            })
        ]);

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const subscriptionRows = gym.members.map((m) => {
            const exp = m.subscription?.expiresAt ? new Date(m.subscription.expiresAt) : null;
            const status = m.subscription?.status || 'none';
            const daysLeft = exp ? Math.ceil((exp.getTime() - now) / oneDayMs) : null;
            return {
                memberId: m._id,
                name: m.name,
                status,
                planType: m.subscription?.planType || 'monthly',
                expiresAt: exp,
                daysLeft
            };
        });
        const expiringSoon = subscriptionRows.filter((s) => s.status === 'active' && s.daysLeft !== null && s.daysLeft <= 1);

        const revenueReport = transactions.reduce((acc, t) => {
            const amt = Number(t.amount) || 0;
            if (t.type === 'membership') acc.membership += amt;
            else if (t.type === 'retail') acc.retail += amt;
            else if (t.type === 'salary') acc.salary += amt;
            return acc;
        }, { membership: 0, retail: 0, salary: 0 });
        revenueReport.net = revenueReport.membership + revenueReport.retail - revenueReport.salary;

        res.json({
            gymDetails: gym,
            financialStatus: gym.financialStatus,
            members: gym.members,
            coaches: gym.coaches,
            attendance: {
                activeNow: activeAttendance,
                todayCheckIns: todayAttendance
            },
            subscriptions: subscriptionRows,
            expiringSoon,
            revenueReport,
            recentTransactions: transactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update gym fees
exports.updateFees = async (req, res) => {
    try {
        const { admissionFee, monthlyFee } = req.body;
        const gym = await Gym.findOneAndUpdate(
            { ownerId: req.user._id },
            { admissionFee, monthlyFee },
            { new: true }
        );

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.json({ message: 'Fees updated successfully', gym });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update coach contract details under gym owner
exports.updateCoachContract = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { salaryPerSession, hourlyRate, workingHours } = req.body;
        const gym = await Gym.findOne({ ownerId: req.user._id });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        if (!gym.coaches.some((c) => String(c) === String(coachId))) {
            return res.status(400).json({ message: 'Coach is not attached to your gym' });
        }

        const idx = gym.coachContracts.findIndex((x) => String(x.coach) === String(coachId));
        const payload = {
            coach: coachId,
            salaryPerSession: Number(salaryPerSession ?? 15),
            hourlyRate: Number(hourlyRate ?? 0),
            workingHours: {
                from: workingHours?.from || '07:00',
                to: workingHours?.to || '19:00'
            }
        };
        if (idx >= 0) gym.coachContracts[idx] = payload;
        else gym.coachContracts.push(payload);
        await gym.save();
        res.json({ message: 'Coach contract updated', contract: payload });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
