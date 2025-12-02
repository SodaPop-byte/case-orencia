// server.js (ESM) - FINAL WITH NOTIFICATION SUPPORT
import app from './src/app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware, initializeSocketHandlers } from './src/socket/socketHandler.js';

// Load environment variables from .env file
dotenv.config(); 

// Connect Database
connectDB();

// ----------------------------------------------------
// SOCKET.IO INTEGRATION
// ----------------------------------------------------

// 1. Create HTTP server from the Express app
const server = http.createServer(app);

// 2. Configure Socket.io server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Must match frontend URL
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- CRITICAL NEW LINE FOR NOTIFICATIONS ---
// This allows your API Controllers (req.app.get('io')) to send real-time alerts
app.set('io', io); 
// -------------------------------------------

// 3. Apply Authentication Middleware to Sockets
// io.use(socketAuthMiddleware); 

// 4. Initialize Socket Event Listeners (Chat logic)
initializeSocketHandlers(io);

// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------

// Define port for Render deployment
const PORT = process.env.PORT || 8080; 

// Start the combined HTTP/Socket.io server
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Socket.IO listening on port ${PORT}`);
});