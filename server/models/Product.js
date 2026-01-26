const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['supplement', 'gear', 'drink', 'apparel', 'other'], required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true },
    image: { type: String } // URL placeholder
});

module.exports = mongoose.model('Product', productSchema);
