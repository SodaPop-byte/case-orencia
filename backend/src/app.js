// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
dotenv.config();

// --- Load Models ---
import './models/user.model.js'; 
import './models/order.model.js'; 
import './models/product.model.js'; 
import './models/banner.model.js'; 
import './models/chatRoom.model.js'; 
import './models/message.model.js'; 

// Custom Middleware and Routes
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js'; 
import resellerRoutes from './routes/reseller.routes.js'; 
import chatRoutes from './routes/chat.routes.js'; 
import contentRoutes from './routes/content.routes.js';
import publicRoutes from './routes/public.routes.js'; 

// ✅ ADD THIS IMPORT
import productRoutes from './routes/product.routes.js'; 

const app = express();

// ------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE & SECURITY
// ------------------------------------------------------------------

app.use(helmet());
app.use(mongoSanitize());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// --- CORS CONFIGURATION ---
const allowedOrigins = [
    "http://localhost:5173",                  
    "https://case-orencia.vercel.app",        
    process.env.FRONTEND_URL                  
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); 
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, 
};

app.use(cors(corsOptions));


// ------------------------------------------------------------------
// 2. ROUTES
// ------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Case Orencia API is running smoothly.' });
});

app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/public', publicRoutes); 

// ✅ ADD THIS LINE (This fixes the 404 on the catalog)
app.use('/api/v1/products', productRoutes);

app.use('/api/v1/admin', adminRoutes);   
app.use('/api/v1/reseller', resellerRoutes); 
app.use('/api/v1/chat', chatRoutes);     
app.use('/api/v1/content', contentRoutes); 

// ------------------------------------------------------------------
// 3. ERROR HANDLING
// ------------------------------------------------------------------

app.use(errorHandler);

export default app;