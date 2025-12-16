// File B: backend/src/socket/socketHandler.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Message from '../models/message.model.js';
import ChatRoom from '../models/chatRoom.model.js';

dotenv.config();

// Middleware
export const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
};

// Handler
export const initializeSocketHandlers = (io) => {
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`🔌 [Handler] User connected: ${userId}`);

        // 1. Join Room
        socket.on('join-room', (roomId) => {
            if (roomId) {
                const roomStr = roomId.toString();
                socket.join(roomStr);
                console.log(`👤 [Handler] User joined: ${roomStr}`);
            }
        });

        // 2. Send Message
        socket.on('send-message', async ({ roomId, content }) => {
            try {
                if (!roomId || !content) return;
                const roomStr = roomId.toString();

                // A. Save
                const newMessage = await Message.create({
                    chatRoomId: roomId,
                    senderId: userId,
                    content: content
                });

                // B. Update Room
                await ChatRoom.findByIdAndUpdate(roomId, { 
                    lastMessage: newMessage._id, 
                    updatedAt: new Date() 
                });

                // C. Populate
                await newMessage.populate('senderId', 'name email role pic');
                
                // D. Emit
                io.to(roomStr).emit('new_message', newMessage);
                console.log(`📨 [Handler] Sent to room ${roomStr}`);

            } catch (error) {
                console.error("Error:", error);
            }
        });

        socket.on('typing', ({ roomId, isTyping }) => {
            if(roomId) socket.to(roomId.toString()).emit('typing', { senderId: userId, isTyping });
        });
    });
};