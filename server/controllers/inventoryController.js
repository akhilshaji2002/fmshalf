const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add Product
exports.addProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Process Sale (POS)
exports.processSale = async (req, res) => {
    const { items, totalAmount, userId } = req.body; // items: [{ productId, quantity, price }]

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create Transaction Record
        const transaction = new Transaction({
            type: 'retail',
            amount: totalAmount,
            items: items.map(i => ({ product: i.productId, quantity: i.quantity, priceAtSale: i.price })),
            relatedUser: userId || null
        });

        await transaction.save({ session });

        // 2. Decrement Stock
        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

            product.stock -= item.quantity;
            await product.save({ session });
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Sale processed successfully', transaction });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};
