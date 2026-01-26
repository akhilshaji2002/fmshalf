const mongoose = require('mongoose');

const metricRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    age: { type: Number, required: true },
    bmr: { type: Number, required: true },
    tdee: { type: Number, required: true },
    activityLevel: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MetricRecord', metricRecordSchema);
