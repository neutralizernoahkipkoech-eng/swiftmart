const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    author: { type: String, required: true }, // Can be customer name or "Anonymous"
    approved: { type: Boolean, default: false }, // Admin must approve before it shows on the site
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);