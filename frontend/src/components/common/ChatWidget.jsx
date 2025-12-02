// ChatWidget.jsx (ESM) - FINAL MERGED VERSION (No external ChatRoom dependency)
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket.js'; 
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../utils/api.js';
import { FaComments, FaCircle, FaChevronRight, FaUser, FaSpinner, FaPaperPlane, FaTimes } from 'react-icons/fa';

// REPLACE WITH YOUR REAL ADMIN ID
const ADMIN_USER_ID = '692a5e5fa21f0f0545980e90'; 

// --- INTERNAL CHAT ROOM COMPONENT ---
const ChatRoomInternal = ({ roomId, otherUser, closeChat }) => {
    const { user } = useAuth();
    const { socket, emit, on, off, isConnected } = useSocket();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/messages/${roomId}?limit=50`);
                setMessages(response.data.data);
            } catch (err) { console.error(err); }
        };
        if (roomId) {
            setMessages([]); 
            fetchHistory();
            if (isConnected) emit('mark-seen', { roomId });
        }
    }, [roomId, isConnected]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            if (message.chatRoomId === roomId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                if (message.senderId !== user.id) emit('mark-seen', { roomId });
            }
        };
        const handleTyping = (data) => {
            if (data.senderId === otherUser._id) setIsTyping(data.isTyping);
        };

        on('new-message', handleNewMessage);
        on('typing', handleTyping);
        return () => { off('new-message', handleNewMessage); off('typing', handleTyping); };
    }, [roomId, on, off, emit]);
    
    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isTyping]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected) return;
        emit('send-message', { roomId, content: input.trim(), receiverId: otherUser._id });
        emit('typing', { roomId, isTyping: false });
        setInput('');
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (e.target.value.length > 0) emit('typing', { roomId, isTyping: true });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 font-sans">
            <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{otherUser.name?.charAt(0) || 'U'}</div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{otherUser.name || 'User'}</h3>
                        <p className="text-xs text-gray-500">{isConnected ? '● Live' : '○ Reconnecting...'}</p>
                    </div>
                </div>
                <button onClick={closeChat}><FaTimes className="text-gray-400 hover:text-gray-600" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg) => (
                    <div key={msg._id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right opacity-70 ${msg.senderId === user.id ? 'text-indigo-100' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-xs text-gray-400 ml-2 animate-pulse">typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input type="text" value={input} onChange={handleInputChange} placeholder="Type a message..." className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2 text-sm outline-none dark:text-white" />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full"><FaPaperPlane /></button>
                </form>
            </footer>
        </div>
    );
};

// --- MAIN WIDGET COMPONENT ---
const ChatWidget = () => {
    const { isConnected, socket } = useSocket();
    const { user, isAuthenticated } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [adminRooms, setAdminRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [activeRoom, setActiveRoom] = useState(null); 
    
    const targetUserId = user?.role === 'reseller' ? ADMIN_USER_ID : null; 

    useEffect(() => {
        if (isChatOpen && isAuthenticated && user.role === 'admin' && !activeRoom) {
            const fetchAdminRooms = async () => {
                setIsLoadingRooms(true);
                try {
                    const response = await api.get('/chat/rooms');
                    setAdminRooms(response.data.data);
                } catch (err) { console.error("Failed to fetch active chats:", err); } 
                finally { setIsLoadingRooms(false); }
            };
            fetchAdminRooms();
        }
    }, [isChatOpen, isAuthenticated, user?.role, activeRoom]);

    const startResellerChat = async () => {
        if (!isAuthenticated || !targetUserId) return;
        try {
            const response = await api.post('/chat/room', { targetUserId });
            const room = response.data.data;
            enterRoom(room);
        } catch (err) { console.error("Failed to start chat:", err); }
    };

    const enterRoom = (room) => {
        let otherUser = room.otherUser;
        if (!otherUser && room.participants) {
             otherUser = room.participants.find(p => p._id !== user.id);
        }
        setActiveRoom({
            roomId: room._id,
            otherUser: otherUser || { name: 'Admin' }, 
        });
        if (isConnected) socket.emit('join-room', room._id);
    };
    
    useEffect(() => {
        if (isConnected && activeRoom?.roomId) socket.emit('join-room', activeRoom.roomId);
    }, [isConnected, activeRoom?.roomId]);

    if (!socket || !isAuthenticated) return null;

    const statusColor = isConnected ? 'text-green-500' : 'text-red-500';

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <button onClick={() => {setIsChatOpen(!isChatOpen); if (isChatOpen) setActiveRoom(null);}} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center">
                {isChatOpen ? <FaChevronRight className="w-6 h-6 rotate-90" /> : <FaComments className="w-6 h-6" />}
                <FaCircle className={`absolute top-1 right-1 w-3 h-3 border-2 border-white rounded-full ${statusColor}`} />
            </button>
            
            {isChatOpen && (
                <div className="absolute bottom-20 right-0 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in origin-bottom-right">
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
                                                {/* FILTER GHOST ROOMS */}
                                                {adminRooms.filter(r => r.otherUser && r.otherUser.name).map(room => (
                                                    <div key={room._id} onClick={() => enterRoom(room)} className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center">
                                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 rounded-full flex items-center justify-center font-bold mr-3 shrink-0">{room.otherUser.name?.charAt(0)}</div>
                                                        <div className="flex-1 min-w-0"><h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{room.otherUser.name}</h4><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{room.otherUser.email}</p></div>
                                                        <FaChevronRight className="text-gray-300 w-3 h-3" />
                                                    </div>
                                                ))}
                                                {adminRooms.length === 0 && <p className="text-center py-10 text-gray-500">No messages.</p>}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2"><FaComments className="w-8 h-8" /></div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Need Help?</h4>
                                        <button onClick={startResellerChat} disabled={!isConnected} className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-lg">Start Chat</button>
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