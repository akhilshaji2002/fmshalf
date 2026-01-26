const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['retail', 'membership', 'salary'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional (e.g., member buying)
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number },
            priceAtSale: { type: Number }
        }
    ],
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['upi', 'card', 'cash', 'none'], default: 'none' },
    transactionId: { type: String } // Gateway Reference
});

module.exports = mongoose.model('Transaction', transactionSchema);
