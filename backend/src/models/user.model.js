// user.model.js (ESM) - FINAL SECURITY CHECK (Password Hashing Hook)
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required.'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    // CRITICAL: The field name must be 'password' for the pre-save hook to fire
    password: { 
        type: String,
        required: [true, 'Password is required.'],
        minlength: [8, 'Password must be at least 8 characters long.']
    },
    role: {
        type: String,
        enum: ['admin', 'reseller', 'staff'],
        default: 'reseller'
    },
    isVerified: {
        type: Boolean,
        default: true // Simplified for MVP/deployment
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


// --- CRITICAL FUNCTION: Password Hashing ---
// This pre-save hook hashes the password before saving to the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { // Only hash if password field is being changed
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to Mongoose
    }
});

// Instance method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;