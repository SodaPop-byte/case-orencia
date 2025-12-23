import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // ⚠️ I recommend 'bcryptjs' to avoid Windows build errors

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
    password: { 
        type: String,
        required: [true, 'Password is required.'],
        minlength: [8, 'Password must be at least 8 characters long.']
    },
    role: {
        type: String,
        enum: ['admin', 'reseller', 'staff', 'user'],
        default: 'reseller'
    },
    isVerified: {
        type: Boolean,
        default: true 
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

// Password Hashing Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { 
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); 
    }
});

// Compare Password Method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;