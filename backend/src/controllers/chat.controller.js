// chat.controller.js (ESM) - FINAL: SHARED ADMIN INBOX
import * as chatService from '../services/chat.service.js';
import ChatRoom from '../models/chatRoom.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';

// 1. Find or Create a Room (Reseller starts chat)
export const findOrCreateRoom = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        
        // Logic: Check if room exists between these two specific people
        const room = await chatService.findOrCreateChatRoom(req.user.id, targetUserId);
        
        // Populate details immediately so frontend can use it
        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('participants', 'name role email')
            .lean();
            
        // Helper to identify the "other" person for the frontend
        const otherUser = populatedRoom.participants.find(p => p._id.toString() !== req.user.id);

        res.status(200).json({ 
            success: true, 
            data: { ...populatedRoom, otherUser } 
        });
    } catch (e) { 
        res.status(400).json({ success: false, message: e.message }); 
    }
};

// 2. Get List of Rooms (THE FIX IS HERE)
export const getMyChatRooms = async (req, res) => {
    try {
        let query = { participants: req.user.id }; // Default: Only show MY rooms

        // --- CRITICAL FIX: SHARED INBOX LOGIC ---
        // If the user requesting the list is an ADMIN, show ALL rooms.
        // This allows Admin 2 to see chats started with Admin 1.
        if (req.user.role === 'admin') {
            query = {}; // Empty query = Find All
        }
        // ----------------------------------------

        const rooms = await ChatRoom.find(query)
            .populate('participants', 'name role email')
            .sort({ updatedAt: -1 })
            .lean();

        const formattedRooms = rooms.map(room => {
            // Logic to determine who the "Other Person" is
            let other;
            
            if (req.user.role === 'admin') {
                // If I am Admin, the "other" is the Reseller (anyone who isn't an admin)
                // OR if both are admins, it's the one who isn't me
                other = room.participants.find(p => p.role === 'reseller') 
                     || room.participants.find(p => p._id.toString() !== req.user.id);
            } else {
                // If I am Reseller, the "other" is the Admin
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