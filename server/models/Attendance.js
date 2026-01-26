const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    method: { type: String, default: 'qr_code' }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
