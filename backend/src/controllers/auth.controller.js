// backend/src/controllers/auth.controller.js
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import * as authService from '../services/auth.service.js';
import sendEmail from '../utils/sendEmail.js'; 
import { z } from 'zod';
import jwt from 'jsonwebtoken'; // 🟢 Added this import!

// --- Validation Schemas ---
const registerSchema = z.object({
    name: z.string().min(3, "Name too short"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be 8+ chars").regex(/[0-9]/, "Must have a number"),
    role: z.enum(['admin', 'reseller', 'staff']).optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

// --- CONTROLLERS ---

// 1. Send OTP (Sends Real Email via Brevo)
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });

        // Generate 6-digit Code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (Clear old OTPs first)
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp: otpCode });

        // 🟢 SEND REAL EMAIL
        const emailSubject = "Casa Orencia - Verify Your Account";
        const emailBody = `Welcome to Casa Orencia!\n\nYour verification code is: ${otpCode}\n\nThis code expires in 5 minutes.`;
        
        // Attempt to send email
        const emailSent = await sendEmail(email, emailSubject, emailBody);

        // ⚠️ DEMO BACKUP: Log to console
        console.log(`\n================================`);
        console.log(`🔐 OTP for ${email}: ${otpCode}`);
        console.log(`📧 Email Sent Status: ${emailSent ? "SUCCESS" : "FAILED"}`);
        console.log(`================================\n`);

        if (emailSent) {
            res.status(200).json({ success: true, message: `OTP sent to ${email}` });
        } else {
            res.status(200).json({ success: true, message: "Email failed (Check Server Console for Code)" });
        }

    } catch (e) {
        console.error("OTP Error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
};

// 2. Register (Verifies OTP)
export const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const { email, otp } = req.body;

        // Verify OTP
        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

        // Create User
        const newUser = await authService.registerUser(validatedData);
        
        // Cleanup OTP
        await Otp.deleteOne({ _id: validOtp._id });

        res.status(201).json({ success: true, message: 'User registered successfully.', data: newUser });
    } catch (error) {
        const msg = error instanceof z.ZodError ? error.errors[0].message : error.message;
        res.status(400).json({ success: false, message: msg });
    }
};

// 3. Login (Returns Token)
export const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        // Set Refresh Token Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // Set 'true' in production (https)
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Send Access Token
        res.status(200).json({ 
            success: true, 
            message: 'Login successful.', 
            data: { user, accessToken } 
        });

    } catch (error) {
        res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
};

// 4. Logout
export const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
};

// 5. Refresh Token (✅ NOW IMPLEMENTED)
export const refreshTokenHandler = async (req, res) => {
    try {
        const cookies = req.cookies;
        // Check if cookie exists
        if (!cookies?.refreshToken) return res.status(401).json({ message: 'No refresh token' });

        const refreshToken = cookies.refreshToken;

        // Verify Token
        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET,
            async (err, decoded) => {
                if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });

                // Find User
                const foundUser = await User.findById(decoded.id);
                if (!foundUser) return res.status(401).json({ message: 'User not found' });

                // Create NEW Access Token
                const accessToken = jwt.sign(
                    { 
                        "UserInfo": {
                            "id": foundUser._id,
                            "role": foundUser.role 
                        }
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );

                // Send back new token
                res.json({ accessToken });
            }
        );
    } catch (error) {
        console.error("Refresh Error:", error);
        res.status(500).json({ message: error.message });
    }
};