const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const Gym = require('../models/Gym');
const mongoose = require('mongoose');
const applyPlanDiscount = (planType, amount) => {
    if (['quarterly', 'six_month', 'yearly'].includes(planType)) {
        return Math.round(amount * 0.9); // 10% off
    }
    return Math.round(amount);
};

// Create a payment session (creates a PENDING transaction)
exports.createPaymentSession = async (req, res) => {
    try {
        const { items, totalAmount, type, planType, gymId, enrollmentDetails, trainerAddOn } = req.body;
        const paymentType = type || 'retail';
        const safeItems = Array.isArray(items) ? items : [];

        const selectedGymId = gymId || req.user?.currentGym || null;
        let finalAmount = Number(totalAmount) || 0;
        if (paymentType === 'membership') {
            const gym = selectedGymId ? await Gym.findById(selectedGymId).select('monthlyFee') : null;
            const months = planType === 'yearly' ? 12 : planType === 'six_month' ? 6 : planType === 'quarterly' ? 3 : planType === 'daily' ? 0 : 1;
            const base = planType === 'daily' ? 100 : Number(gym?.monthlyFee || 0) * (months || 1);
            const discountedBase = applyPlanDiscount(planType, base);
            const trainerAddonAmount = Number(trainerAddOn?.amountInr || 0);
            if (!finalAmount) {
                finalAmount = discountedBase + trainerAddonAmount;
            }
        }
        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        // type: 'retail' (store) or 'membership'
        const transaction = new Transaction({
            type: paymentType,
            amount: finalAmount,
            relatedUser: req.user._id,
            gym: selectedGymId,
            items: safeItems.map(i => ({
                product: i._id,
                quantity: i.quantity || 1,
                priceAtSale: i.price
            })),
            meta: paymentType === 'membership'
                ? {
                    planType: planType || 'monthly',
                    months: planType === 'yearly' ? 12 : planType === 'six_month' ? 6 : planType === 'quarterly' ? 3 : 1,
                    discountPercent: ['quarterly', 'six_month', 'yearly'].includes(planType) ? 10 : 0,
                    enrollmentDetails: enrollmentDetails || {},
                    trainerAddOn: trainerAddOn || null
                }
                : {},
            status: 'pending'
        });

        await transaction.save();

        res.status(201).json({
            sessionId: transaction._id,
            message: 'Session created',
            amount: finalAmount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify Payment (updates status and stock)
exports.verifyPayment = async (req, res) => {
    const { sessionId, paymentMethod, transactionId } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transaction = await Transaction.findById(sessionId).session(session);
        if (!transaction) throw new Error('Session not found');
        if (transaction.status === 'completed') return res.status(200).json({ message: 'Already paid' });

        // Update Transaction
        transaction.status = 'completed';
        transaction.paymentMethod = paymentMethod;
        transaction.transactionId = transactionId;
        await transaction.save({ session });

        // Update Inventory if retail
        if (transaction.type === 'retail') {
            for (const item of transaction.items) {
                const product = await Product.findById(item.product).session(session);
                if (product) {
                    product.stock -= item.quantity;
                    await product.save({ session });
                }
            }
        }
        if (transaction.type === 'membership') {
            const member = await User.findById(transaction.relatedUser).session(session);
            const gym = transaction.gym ? await Gym.findById(transaction.gym).session(session) : null;
            if (member) {
                const now = new Date();
                const months = transaction.meta?.months || 1;
                const start = member.subscription?.status === 'active' && member.subscription?.expiresAt && member.subscription.expiresAt > now
                    ? new Date(member.subscription.expiresAt)
                    : now;
                const expires = new Date(start);
                if (transaction.meta?.planType === 'daily') {
                    expires.setDate(expires.getDate() + 1);
                } else {
                    expires.setMonth(expires.getMonth() + months);
                }
                member.subscription = {
                    status: 'active',
                    planType: transaction.meta?.planType || 'monthly',
                    startedAt: start,
                    expiresAt: expires,
                    lastPaymentTransaction: transaction._id
                };
                if (transaction.meta?.enrollmentDetails?.mobileNumber) {
                    member.mobileNumber = transaction.meta.enrollmentDetails.mobileNumber;
                }
                if (transaction.meta?.enrollmentDetails?.nationalId?.idNumber) {
                    member.nationalId = transaction.meta.enrollmentDetails.nationalId;
                }
                if (gym) {
                    if (!gym.members.some((m) => String(m) === String(member._id))) {
                        gym.members.push(member._id);
                    }
                    const affIdx = (member.affiliations || []).findIndex((a) => String(a.gym) === String(gym._id) && a.roleInGym === 'member');
                    const affPayload = {
                        gym: gym._id,
                        roleInGym: 'member',
                        membership: {
                            status: 'active',
                            packageType: transaction.meta?.planType || 'monthly',
                            startedAt: start,
                            expiresAt: expires,
                            workoutTime: transaction.meta?.enrollmentDetails?.workoutTime || '',
                            planAmountInr: transaction.amount
                        }
                    };
                    if (affIdx >= 0) member.affiliations[affIdx] = affPayload;
                    else member.affiliations.push(affPayload);
                    member.currentGym = gym._id;
                    await gym.save({ session });
                }
                await member.save({ session });
            }
            if (transaction.gym) {
                await Gym.findByIdAndUpdate(transaction.gym, {
                    $inc: { 'financialStatus.totalEarnings': transaction.amount }
                }, { session });
            }
            if (transaction.meta?.trainerAddOn?.trainerId && Number(transaction.meta?.trainerAddOn?.amountInr || 0) > 0) {
                await exports.creditTrainer(transaction.meta.trainerAddOn.trainerId, Number(transaction.meta.trainerAddOn.amountInr), {
                    gymId: transaction.gym,
                    paidBy: transaction.relatedUser,
                    trainingType: 'personal_training'
                });
            }
        }

        await session.commitTransaction();
        res.json({ success: true, message: 'Payment verified and inventory updated' });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

// Trainer Earnings
exports.getTrainerEarnings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('wallet');
        res.json(user.wallet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Transaction History (for Trainers/Users)
exports.getTransactionHistory = async (req, res) => {
    try {
        const history = await Transaction.find({ relatedUser: req.user._id })
            .sort({ date: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Credit Trainer for Session (Internal Use)
exports.creditTrainer = async (trainerId, amount, options = {}) => {
    try {
        const trainer = await User.findById(trainerId);
        if (trainer && trainer.role === 'trainer') {
            trainer.wallet.balance += amount;
            trainer.wallet.totalEarnings += amount;
            await trainer.save();

            // Log Transaction
            await Transaction.create({
                type: 'salary',
                amount: amount,
                relatedUser: trainerId,
                gym: options.gymId || null,
                booking: options.bookingId || null,
                status: 'completed',
                meta: {
                    paidBy: options.paidBy || 'system',
                    trainingType: options.trainingType || 'gym'
                },
                description: 'Session Compensation Credited'
            });
        }
    } catch (error) {
        console.error('Error crediting trainer:', error);
    }
};
