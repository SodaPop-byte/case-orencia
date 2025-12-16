// File A: backend/services/socket.service.js
import Message from '../models/message.model.js';
import ChatRoom from '../models/chatRoom.model.js';

export default function socketHandler(io) {
    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId || socket.user?.id;
        console.log(`🔌 [Service] User connected: ${userId}`);

        // 1. Join Room (Force String ID)
        socket.on('join-room', (roomId) => {
            if (roomId) {
                const roomStr = roomId.toString();
                socket.join(roomStr);
                console.log(`👤 [Service] User joined: ${roomStr}`);
            }
        });

        // 2. Send Message
        socket.on('send-message', async ({ roomId, content }) => {
            try {
                if (!roomId || !content) return;
                const roomStr = roomId.toString();

                // A. Save to Database
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

                // D. Emit (Force String ID + Correct Event Name)
                io.to(roomStr).emit('new_message', newMessage);
                console.log(`📨 [Service] Sent to room ${roomStr}: ${content}`);

            } catch (err) {
                console.error("Error:", err);
            }
        });

        socket.on('typing', ({ roomId, isTyping }) => {
            if(roomId) socket.to(roomId.toString()).emit('typing', { senderId: userId, isTyping });
        });
    });
}