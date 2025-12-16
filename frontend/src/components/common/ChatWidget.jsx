// src/components/common/ChatWidget.jsx (FINAL: STABLE & INSTANT)
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext.jsx'; 
import { useAuth } from '../../context/AuthContext.jsx'; 
import api from '../../utils/api.js';
import { FaComments, FaCircle, FaChevronRight, FaSpinner, FaPaperPlane, FaTimes, FaUserShield } from 'react-icons/fa';

const ChatRoomInternal = ({ roomId, otherUser, closeChat }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const safeOtherUser = otherUser || { name: 'Support', _id: 'unknown' };

    // 1. Fetch History & Join Room
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/messages/${roomId}`);
                setMessages(response.data.data || []);
            } catch (err) { console.error(err); }
        };

        if (roomId && socket) {
            socket.emit('join-room', String(roomId));
            fetchHistory();
            socket.emit('mark-seen', { roomId });
        }
    }, [roomId, socket]);

    // 2. Real-Time Listener
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            // Handle ID mismatch (String vs Object)
            const msgRoomId = typeof message.chatRoomId === 'object' 
                ? message.chatRoomId._id 
                : message.chatRoomId;

            if (String(msgRoomId) === String(roomId)) {
                setMessages(prev => {
                    // Remove optimistic temp message if it exists (replace with real one)
                    // We assume the real one arrives shortly after
                    const filtered = prev.filter(m => !m.isOptimistic); 
                    
                    // Check for duplicates
                    if (filtered.some(m => m._id === message._id)) return filtered;
                    
                    return [...filtered, message];
                });
                
                // Mark seen
                const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
                if (String(senderId) !== String(user._id)) {
                    socket.emit('mark-seen', { roomId });
                }
            }
        };

        const handleTyping = (data) => {
            if (String(data.senderId) === String(safeOtherUser._id)) setIsTyping(data.isTyping);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('typing', handleTyping);
        
        return () => { 
            socket.off('new-message', handleNewMessage); 
            socket.off('typing', handleTyping); 
        };
    }, [roomId, socket, safeOtherUser._id, user._id]);
    
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const content = input.trim();
        if (!content || !socket) return;
        
        // A. OPTIMISTIC UPDATE (Show Immediately)
        const tempMsg = {
            _id: `temp-${Date.now()}`,
            chatRoomId: roomId,
            senderId: user, // Use full user object so it renders correctly
            content: content,
            createdAt: new Date().toISOString(),
            isOptimistic: true 
        };

        setMessages(prev => [...prev, tempMsg]);
        setInput(''); 

        // B. Send to Server
        socket.emit('send-message', { roomId, content });
        socket.emit('typing', { roomId, isTyping: false });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 font-sans">
            <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {safeOtherUser.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                            {safeOtherUser.name || 'Support'}
                        </h3>
                        <p className="text-xs text-gray-500">Live Chat</p>
                    </div>
                </div>
                <button onClick={closeChat}><FaTimes className="text-gray-400 hover:text-gray-600" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg, idx) => {
                    const senderObj = typeof msg.senderId === 'object' ? msg.senderId : { _id: msg.senderId };
                    const isMe = String(senderObj._id) === String(user._id) || String(senderObj._id) === String(user.id);

                    return (
                        <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && (
                                <span className="text-[10px] text-gray-400 mb-1 ml-2 flex items-center gap-1">
                                    {senderObj.role === 'admin' && <FaUserShield className="text-indigo-500" />}
                                    {senderObj.name || 'Admin'}
                                </span>
                            )}
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'} ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                                <p>{msg.content}</p>
                                <div className="flex justify-end items-center gap-1 mt-1">
                                    <p className={`text-[10px] ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                    </p>
                                    {msg.isOptimistic && <FaSpinner className="animate-spin w-3 h-3 text-white" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isTyping && <div className="text-xs text-gray-400 ml-2 animate-pulse">typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => {
                            setInput(e.target.value);
                            socket?.emit('typing', { roomId, isTyping: true });
                        }} 
                        placeholder="Type a message..." 
                        className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2 text-sm outline-none dark:text-white" 
                    />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
                        <FaPaperPlane />
                    </button>
                </form>
            </footer>
        </div>
    );
};

// --- MAIN WIDGET ---
const ChatWidget = () => {
    const { isConnected, socket } = useSocket();
    const { user, isAuthenticated } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [adminRooms, setAdminRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [activeRoom, setActiveRoom] = useState(null); 
    
    // Reseller Auto-Connect
    useEffect(() => {
        if (isAuthenticated && user?.role === 'reseller' && socket && isConnected) {
            const connectResellerToRoom = async () => {
                try {
                    const response = await api.post('/chat/room', {});
                    const room = response.data.data;
                    socket.emit('join-room', String(room._id));
                } catch (err) { console.error("Auto-connect failed", err); }
            };
            connectResellerToRoom();
        }
    }, [isAuthenticated, user?.role, socket, isConnected]);

    // Admin Fetch Rooms
    useEffect(() => {
        if (isChatOpen && isAuthenticated && user?.role === 'admin' && !activeRoom) {
            const fetchAdminRooms = async () => {
                setIsLoadingRooms(true);
                try {
                    const response = await api.get('/chat/rooms');
                    setAdminRooms(response.data.data || []);
                } catch (err) { console.error("Failed to fetch chats:", err); } 
                finally { setIsLoadingRooms(false); }
            };
            fetchAdminRooms();
        }
    }, [isChatOpen, isAuthenticated, user?.role, activeRoom]);

    const enterRoom = (room) => {
        let otherUser = room.otherUser;
        if (!otherUser && room.participants) {
             otherUser = room.participants.find(p => String(p._id) !== String(user._id) && String(p._id) !== String(user.id));
        }
        
        setActiveRoom({
            roomId: room._id,
            otherUser: otherUser || { name: 'Support', _id: 'unknown' }, 
        });
        
        if (socket && isConnected) socket.emit('join-room', String(room._id));
    };

    if (!isAuthenticated) return null;
    const statusColor = isConnected ? 'text-green-500' : 'text-red-500';

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <button onClick={() => {setIsChatOpen(!isChatOpen); if (isChatOpen) setActiveRoom(null);}} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center">
                {isChatOpen ? <FaChevronRight className="w-6 h-6 rotate-90" /> : <FaComments className="w-6 h-6" />}
                <FaCircle className={`absolute top-1 right-1 w-3 h-3 border-2 border-white rounded-full ${statusColor}`} />
            </button>
            
            {isChatOpen && (
                <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in origin-bottom-right">
                    {activeRoom ? (
                        <ChatRoomInternal roomId={activeRoom.roomId} otherUser={activeRoom.otherUser} closeChat={() => setActiveRoom(null)} />
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="p-5 bg-indigo-600 dark:bg-gray-900 text-white">
                                <h3 className="font-bold text-lg">Messages</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-2">
                                {user.role === 'admin' ? (
                                    <>
                                        {isLoadingRooms ? <div className="flex justify-center items-center h-40 text-gray-400"><FaSpinner className="animate-spin w-6 h-6" /></div> : (
                                            <div className="space-y-2">
                                                {adminRooms.length === 0 ? <p className="text-center py-10 text-gray-500">No active chats.</p> : 
                                                adminRooms.map(room => {
                                                    const name = room.otherUser?.name || 'Unknown User';
                                                    return (
                                                        <div key={room._id} onClick={() => enterRoom(room)} className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center">
                                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 rounded-full flex items-center justify-center font-bold mr-3 shrink-0">
                                                                {name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{room.lastMessage || 'No messages yet'}</p>
                                                            </div>
                                                            <FaChevronRight className="text-gray-300 w-3 h-3" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2"><FaComments className="w-8 h-8" /></div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Need Help?</h4>
                                        <p className="text-sm text-gray-500">Chat with our support team directly.</p>
                                        <button onClick={async () => {
                                            const response = await api.post('/chat/room', {});
                                            enterRoom(response.data.data);
                                        }} disabled={!isConnected} className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50">
                                            Open Chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;