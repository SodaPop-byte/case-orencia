// auth.js (ESM)
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify the access token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// Middleware for Role-Based Access Control
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ 
                success: false, 
                message: 'Forbidden. User role missing.' 
            });
        }
        
        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({ 
                success: false, 
                message: `Forbidden. Role '${req.user.role}' is not allowed.` 
            });
        }
    };
};