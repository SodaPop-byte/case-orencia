// server.js (ESM) - RENDER DEPLOYMENT FIX
import app from './src/app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware, initializeSocketHandlers } from './src/socket/socketHandler.js';

// Load environment variables
dotenv.config(); 

// Connect Database
connectDB();

// 1. Create HTTP server from the Express app
const server = http.createServer(app);

// 2. Configure Socket.io server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Share IO instance with the Express App (For Notifications)
app.set('io', io); 

// 3. Initialize Socket Event Listeners
initializeSocketHandlers(io);

// ----------------------------------------------------
// SERVER START (RENDER FIX)
// ----------------------------------------------------

// Define port for Render deployment (Render sets this automatically in prod)
const PORT = process.env.PORT || 8080; 

// IMPORTANT: Bind to '0.0.0.0' so Render can detect the open port
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Socket.IO listening on port ${PORT}`);
});