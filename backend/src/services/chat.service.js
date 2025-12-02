import ChatRoom from '../models/chatRoom.model.js';
import Message from '../models/message.model.js';

export const findOrCreateChatRoom = async (user1Id, user2Id) => {
    let room = await ChatRoom.findOne({ participants: { $all: [user1Id, user2Id] } });
    if (!room) {
        room = new ChatRoom({ participants: [user1Id, user2Id] });
        await room.save();
    }
    return room;
};
export const getMessageHistory = async (roomId, page = 1, limit = 50) => {
    return await Message.find({ chatRoomId: roomId }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean();
};
export const getActiveRooms = async (userId) => {
    const rooms = await ChatRoom.find({ participants: userId }).populate('participants', 'name role').sort({ updatedAt: -1 }).lean();
    return rooms.map(room => ({ ...room, otherUser: room.participants.find(p => p._id.toString() !== userId.toString()) }));
};