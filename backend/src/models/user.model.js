import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, required: true, unique: true, trim: true, lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    passwordHash: { type: String, required: true },
    role: { 
        type: String, enum: ['admin', 'reseller', 'staff'], default: 'reseller', required: true 
    },
    isEmailVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (this.isModified('passwordHash')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;