// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js'; // 🛑 IMPORT USER MODEL

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 🛑 FIX: Fetch FRESH user data from DB instead of trusting the old token
        // This ensures if you change role in DB, it works IMMEDIATELY
        const user = await User.findById(decoded.id || decoded._id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }

        req.user = user; // Attach the FRESH user (with role: 'reseller')
        next();
    } catch (error) {
        console.log("Auth Error:", error.message);
        return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
};

export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: 'Forbidden. User role missing.' });
        }
        
        // 🛑 DEBUG LOG: See exactly why it fails in your terminal
        if (!allowedRoles.includes(req.user.role)) {
            console.log(`⛔ BLOCKED: User has role '${req.user.role}', but page needs '${allowedRoles}'`);
            
            return res.status(403).json({ 
                success: false, 
                message: `Forbidden. Role '${req.user.role}' is not allowed.` 
            });
        }
        
        next();
    };
};