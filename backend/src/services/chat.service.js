import ChatRoom from '../models/chatRoom.model.js';
import Message from '../models/message.model.js';

// 1. Find or Create Room
export const findOrCreateChatRoom = async (user1Id, user2Id) => {
    let room = await ChatRoom.findOne({ participants: { $all: [user1Id, user2Id] } });
    if (!room) {
        room = new ChatRoom({ participants: [user1Id, user2Id] });
        await room.save();
    }
    return room;
};

// 2. Get Message History
export const getMessageHistory = async (roomId, page = 1, limit = 50) => {
    return await Message.find({ chatRoomId: roomId })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('senderId', 'name email role pic') 
        .lean();
};

// 3. Get Active Rooms
export const getActiveRooms = async (userId) => {
    const rooms = await ChatRoom.find({ participants: userId })
        .populate('participants', 'name role')
        .sort({ updatedAt: -1 })
        .lean();
    return rooms.map(room => ({
        ...room,
        otherUser: room.participants.find(p => p._id.toString() !== userId.toString())
    }));
};

// 4. Send Message (HTTP Backup)
export const sendMessage = async (senderId, roomId, content) => {
    const newMessage = await Message.create({
        chatRoomId: roomId,
        senderId: senderId,
        content: content
    });

    await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: newMessage._id,
        updatedAt: new Date()
    });

    return await newMessage.populate('senderId', 'name email role pic');
};