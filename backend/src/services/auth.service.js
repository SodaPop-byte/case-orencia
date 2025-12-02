import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const registerUser = async (userData) => {
    const { name, email, password, role } = userData;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User with this email already exists.');

    const newUser = new User({ name, email, passwordHash: password, role: role || 'reseller' });
    await newUser.save();
    return { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };
};

export const loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Invalid email or password.');

    const { accessToken, refreshToken } = generateTokens(user);
    return { user: { _id: user._id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) throw new Error('Refresh token is missing.');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('Invalid refresh token.');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
    return { newAccessToken, newRefreshToken };
};