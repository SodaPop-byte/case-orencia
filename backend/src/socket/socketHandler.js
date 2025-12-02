import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Message from '../models/message.model.js';
import ChatRoom from '../models/chatRoom.model.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// 1. Export Middleware
export const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(); // Allow guest/initial connection

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token.'));
    }
};

// 2. Export Event Handlers
export const initializeSocketHandlers = (io) => {
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a conversation room
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // --- HANDLE SEND MESSAGE ---
        socket.on('send-message', async ({ roomId, content, receiverId }) => {
            try {
                const senderId = socket.user ? socket.user.id : null;
                if (!senderId) return; // Guard clause

                // 1. Save to Database
                const newMessage = await Message.create({
                    chatRoomId: roomId,
                    senderId: senderId,
                    content: content
                });

                // 2. Update ChatRoom "lastMessage" (for the list view preview)
                await ChatRoom.findByIdAndUpdate(roomId, { 
                    lastMessage: newMessage._id 
                });

                // 3. Emit to real-time room (so they see it instantly)
                io.to(roomId).emit('new-message', newMessage);
                
                console.log(`Message saved & sent in ${roomId}`);

            } catch (error) {
                console.error("Message send error:", error);
            }
        });

        // --- HANDLE SEEN STATUS ---
        socket.on('mark-seen', async ({ roomId }) => {
            try {
                const userId = socket.user?.id;
                if (!userId) return;

                // Update all messages in this room sent by the OTHER person to isRead: true
                await Message.updateMany(
                    { chatRoomId: roomId, senderId: { $ne: userId }, isRead: false },
                    { $set: { isRead: true } }
                );
            } catch (error) {
                console.error("Mark seen error:", error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    });
};