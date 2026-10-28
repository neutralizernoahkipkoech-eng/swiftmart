const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Made optional
    checkoutRequestId: { type: String, required: false, unique: true, sparse: true }, // Made optional + sparse
    product: { type: String, required: true },
    amount: { type: Number, required: true },
    phone: { type: String, required: true },
    email: { type: String }, // Added email field
    paymentMethod: { type: String, required: true }, // Added paymentMethod
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    mpesaReceiptNumber: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);