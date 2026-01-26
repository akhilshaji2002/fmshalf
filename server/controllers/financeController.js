const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a payment session (creates a PENDING transaction)
exports.createPaymentSession = async (req, res) => {
    try {
        const { items, totalAmount, type } = req.body;

        // type: 'retail' (store) or 'membership'
        const transaction = new Transaction({
            type: type || 'retail',
            amount: totalAmount,
            relatedUser: req.user._id,
            items: items.map(i => ({
                product: i._id,
                quantity: i.quantity || 1,
                priceAtSale: i.price
            })),
            status: 'pending'
        });

        await transaction.save();

        res.status(201).json({
            sessionId: transaction._id,
            message: 'Session created',
            amount: totalAmount
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
exports.creditTrainer = async (trainerId, amount) => {
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
                status: 'completed',
                description: 'Session Compensation Credited'
            });
        }
    } catch (error) {
        console.error('Error crediting trainer:', error);
    }
};
