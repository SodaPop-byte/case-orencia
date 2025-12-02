// app.js (ESM) - FINAL CORRECTED VERSION

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
dotenv.config();

// --- CRITICAL FIX: Ensure Mongoose Models are loaded and registered early ---
// Importing the model files once forces Mongoose to compile the schemas,
// which fixes the population issue in controllers.
import './models/user.model.js'; 
import './models/order.model.js'; 
import './models/product.model.js'; 
import './models/banner.model.js'; 
import './models/chatRoom.model.js'; 
import './models/message.model.js'; 
// -------------------------------------------------------------------------

// Custom Middleware and Routes
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js'; 
import resellerRoutes from './routes/reseller.routes.js'; 
import chatRoutes from './routes/chat.routes.js'; 
import contentRoutes from './routes/content.routes.js';
import publicRoutes from './routes/public.routes.js'; 

const app = express();

// ------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE & SECURITY (MUST COME FIRST)
// ------------------------------------------------------------------

app.use(helmet());
app.use(mongoSanitize());

// Parsing Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, 
};
app.use(cors(corsOptions));


// ------------------------------------------------------------------
// 2. HEALTH CHECK ROUTE 
// ------------------------------------------------------------------

// Root route for checking server health
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Case Orencia API is running smoothly.',
        environment: process.env.NODE_ENV || 'development',
    });
});


// ------------------------------------------------------------------
// 3. API ROUTES (MUST BE DEFINED AFTER MIDDLEWARE)
// ------------------------------------------------------------------

// All routes are prefixed with /api/v1/
app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/public', publicRoutes); 
app.use('/api/v1/admin', adminRoutes);   
app.use('/api/v1/reseller', resellerRoutes); 
app.use('/api/v1/chat', chatRoutes);     
app.use('/api/v1/content', contentRoutes); 


// ------------------------------------------------------------------
// 4. ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ------------------------------------------------------------------

app.use(errorHandler);

export default app;