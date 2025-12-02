import * as chatService from '../services/chat.service.js';

export const findOrCreateRoom = async (req, res) => {
    try {
        const room = await chatService.findOrCreateChatRoom(req.user.id, req.body.targetUserId);
        res.status(200).json({ success: true, data: room });
    } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
export const getMyChatRooms = async (req, res) => {
    try {
        const rooms = await chatService.getActiveRooms(req.user.id);
        res.status(200).json({ success: true, data: rooms });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
export const getRoomHistory = async (req, res) => {
    try {
        const history = await chatService.getMessageHistory(req.params.roomId);
        res.status(200).json({ success: true, data: history });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};