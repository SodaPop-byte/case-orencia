import * as authService from '../services/auth.service.js';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'reseller', 'staff']).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const newUser = await authService.registerUser(validatedData);
        res.status(201).json({ success: true, message: 'User registered.', data: newUser });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: 'Login successful.', data: { user, accessToken } });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

export const refreshTokenHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const { newAccessToken, newRefreshToken } = await authService.refreshAccessToken(refreshToken);
        
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({ success: true, message: 'Refreshed.', data: { accessToken: newAccessToken } });
    } catch (error) {
        res.status(403).json({ success: false, message: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logout successful.' });
};