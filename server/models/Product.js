const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['supplement', 'gear', 'drink', 'apparel', 'other'], required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    // Optional SKU must be sparse to avoid duplicate-null unique index collisions.
    sku: { type: String, unique: true, sparse: true },
    image: { type: String } // URL placeholder
});

module.exports = mongoose.model('Product', productSchema);
