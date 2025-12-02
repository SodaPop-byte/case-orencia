// app.js (ESM) - FINAL CORS FIX
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

const app = express();

// ------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE & SECURITY
// ------------------------------------------------------------------

app.use(helmet());
app.use(mongoSanitize());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// --- CORS CONFIGURATION (TRUST BOTH LOCAL & VERCEL) ---
const allowedOrigins = [
    "http://localhost:5173",                  // Local Development
    "https://case-orencia.vercel.app",        // Live Production
    process.env.FRONTEND_URL                  // Fallback from Env Var
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); // Debugging log
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, 
};

app.use(cors(corsOptions));
// --------------------------------------------------------


// ------------------------------------------------------------------
// 2. ROUTES
// ------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Case Orencia API is running smoothly.' });
});

app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/public', publicRoutes); 
app.use('/api/v1/admin', adminRoutes);   
app.use('/api/v1/reseller', resellerRoutes); 
app.use('/api/v1/chat', chatRoutes);     
app.use('/api/v1/content', contentRoutes); 

// ------------------------------------------------------------------
// 3. ERROR HANDLING
// ------------------------------------------------------------------

app.use(errorHandler);

export default app;// app.js (ESM) - FINAL CORS FIX
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

const app = express();

// ------------------------------------------------------------------
// 1. GLOBAL MIDDLEWARE & SECURITY
// ------------------------------------------------------------------

app.use(helmet());
app.use(mongoSanitize());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// --- CORS CONFIGURATION (TRUST BOTH LOCAL & VERCEL) ---
const allowedOrigins = [
    "http://localhost:5173",                  // Local Development
    "https://case-orencia.vercel.app",        // Live Production
    process.env.FRONTEND_URL                  // Fallback from Env Var
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); // Debugging log
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, 
};

app.use(cors(corsOptions));
// --------------------------------------------------------


// ------------------------------------------------------------------
// 2. ROUTES
// ------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Case Orencia API is running smoothly.' });
});

app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/public', publicRoutes); 
app.use('/api/v1/admin', adminRoutes);   
app.use('/api/v1/reseller', resellerRoutes); 
app.use('/api/v1/chat', chatRoutes);     
app.use('/api/v1/content', contentRoutes); 

// ------------------------------------------------------------------
// 3. ERROR HANDLING
// ------------------------------------------------------------------

app.use(errorHandler);

export default app;