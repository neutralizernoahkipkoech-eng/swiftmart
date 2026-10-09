const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    
    // --- NEW FIELDS FOR PROFESSIONAL AUTH ---
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
});

// YOUR EXISTING WORKING HOOK (Kept exactly as is!)
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// YOUR EXISTING WORKING METHOD (Kept exactly as is!)
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);