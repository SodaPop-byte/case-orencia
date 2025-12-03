// auth.service.js (ESM) - FINAL AUTH FIX: SELECT PASSWORD
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// 2. Register User (Creation Logic)
export const registerUser = async (userData) => {
    const { name, email, password, role } = userData;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User with this email already exists.');

    const newUser = new User({ 
        name, 
        email, 
        password, // Pre-save hook hashes this
        role: role || 'reseller' 
    }); 
    await newUser.save();

    return { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };
};

// 3. Login User (FIXED QUERY)
export const loginUser = async (email, password) => {
    // CRITICAL FIX: Add .select('+password') to force Mongoose to retrieve the hash
    const user = await User.findOne({ email }).select('+password'); 
    
    if (!user) throw new Error('Invalid email or password.');

    const isMatch = await user.comparePassword(password); 
    if (!isMatch) throw new Error('Invalid email or password.');

    const { accessToken, refreshToken } = generateTokens(user);
    return { user: { _id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
};

// 4. Refresh Token (Remains the same)
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) throw new Error('Refresh token is missing.');
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id); 
    if (!user) throw new Error('Invalid refresh token.');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
    return { newAccessToken, newRefreshToken };
};

// 5. Update User Profile/Password
export const updateUser = async (userId, updateData) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;

    if (updateData.password) {
        if (updateData.password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(updateData.password, salt);
    }
    
    await user.save();
    
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
    };
};