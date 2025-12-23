// backend/routes/auth.routes.js
import { Router } from 'express';
import { login, register, logout, refreshTokenHandler, sendOtp } from '../controllers/auth.controller.js';

const router = Router();

// 🟢 NEW: Route to send the verification code
router.post('/send-otp', sendOtp);

// Standard Auth Routes
router.post('/register', register); // This now expects 'otp' in the body
router.post('/login', login);
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logout);

export default router;