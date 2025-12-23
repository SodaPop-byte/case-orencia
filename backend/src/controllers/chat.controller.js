import * as chatService from '../services/chat.service.js';
import ChatRoom from '../models/chatRoom.model.js';
import User from '../models/User.js';

// 1. Find or Create a Room
export const findOrCreateRoom = async (req, res) => {
    try {
        let { targetUserId } = req.body;
        if (!targetUserId) {
            const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
            if (!adminUser) throw new Error("No support admin available.");
            targetUserId = adminUser._id;
        }

        const room = await chatService.findOrCreateChatRoom(req.user.id, targetUserId);
        
        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('participants', 'name role email')
            .lean();

        const otherUser = populatedRoom.participants.find(p => p._id.toString() !== req.user.id);

        res.status(200).json({ success: true, data: { ...populatedRoom, otherUser } });
    } catch (e) { 
        res.status(400).json({ success: false, message: e.message }); 
    }
};

// 2. Get List of Rooms
export const getMyChatRooms = async (req, res) => {
    try {
        let query = { participants: req.user.id };
        if (req.user.role === 'admin') query = {}; 

        const rooms = await ChatRoom.find(query)
            .populate('participants', 'name role email')
            .sort({ updatedAt: -1 })
            .lean();

        const formattedRooms = rooms.map(room => {
            let other;
            if (req.user.role === 'admin') {
                other = room.participants.find(p => p.role === 'reseller') 
                      || room.participants.find(p => p._id.toString() !== req.user.id);
            } else {
                other = room.participants.find(p => p._id.toString() !== req.user.id);
            }
            return { ...room, otherUser: other };
        });

        res.status(200).json({ success: true, data: formattedRooms });
    } catch (e) { 
        res.status(500).json({ success: false, message: e.message }); 
    }
};

// 3. Get Message History
export const getRoomHistory = async (req, res) => {
    try {
        const history = await chatService.getMessageHistory(req.params.roomId);
        res.status(200).json({ success: true, data: history });
    } catch (e) { 
        res.status(500).json({ success: false, message: e.message }); 
    }
};

// 4. Send Message (The Socket Refresh Logic)
export const sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const senderId = req.user.id; 

        // Save to DB
        const fullMessage = await chatService.sendMessage(senderId, chatId, content);

        // Socket Refresh
        const io = req.app.get('socketio'); 
        if (io) {
            io.to(chatId).emit("new_message", fullMessage);
        }

        res.status(201).json({ success: true, data: fullMessage });
    } catch (e) { 
        console.error("Send Message Error:", e);
        res.status(500).json({ success: false, message: e.message }); 
    }
};