const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkoutRequestId: { type: String, required: true, unique: true },
    product: { type: String, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    mpesaReceiptNumber: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Automatically manages updatedAt, great for future features
});

module.exports = mongoose.model('Order', orderSchema);