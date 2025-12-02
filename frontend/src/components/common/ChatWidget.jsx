// ChatWidget.jsx (ESM) - ADMIN CHAT LIST UPDATE
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket.js'; 
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../utils/api.js';
import ChatRoom from '../chat/ChatRoom.jsx'; 
import { FaComments, FaCircle, FaChevronRight, FaUser, FaSpinner } from 'react-icons/fa';

// Mock Admin ID (In production, the backend handles routing logic automatically)
const ADMIN_USER_ID = '692a5387e95864bd4fa5d286'; 

const ChatWidget = () => {
    const { isConnected, socket } = useSocket();
    const { user, isAuthenticated } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // State for Admin View
    const [adminRooms, setAdminRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    // State for Active Chat
    const [activeRoom, setActiveRoom] = useState(null); 
    
    const targetUserId = user?.role === 'reseller' ? ADMIN_USER_ID : null; 

    // --- 1. Fetch Rooms (Admin Only) ---
    useEffect(() => {
        if (isChatOpen && isAuthenticated && user.role === 'admin' && !activeRoom) {
            const fetchAdminRooms = async () => {
                setIsLoadingRooms(true);
                try {
                    const response = await api.get('/chat/rooms');
                    setAdminRooms(response.data.data);
                } catch (err) {
                    console.error("Failed to fetch active chats:", err);
                } finally {
                    setIsLoadingRooms(false);
                }
            };
            fetchAdminRooms();
        }
    }, [isChatOpen, isAuthenticated, user?.role, activeRoom]);

    // --- 2. Reseller: Find/Start Chat ---
    const startResellerChat = async () => {
        if (!isAuthenticated || !targetUserId) return;
        try {
            const response = await api.post('/chat/room', { targetUserId });
            const room = response.data.data;
            enterRoom(room);
        } catch (err) {
            console.error("Failed to start chat:", err);
        }
    };

    // --- 3. Helper: Enter a specific room ---
    const enterRoom = (room) => {
        // Determine the 'otherUser' (The person you are talking to)
        // Note: The backend /chat/rooms endpoint already populates 'otherUser'
        // But for /chat/room (create), we might need to calculate it manually if missing
        let otherUser = room.otherUser;
        
        if (!otherUser && room.participants) {
             otherUser = room.participants.find(p => p._id !== user.id);
        }

        setActiveRoom({
            roomId: room._id,
            otherUser: otherUser || { name: 'Admin' }, // Fallback
        });
        
        if (isConnected) {
            socket.emit('join-room', room._id);
        }
    };
    
    // --- 4. Socket Listeners ---
    useEffect(() => {
        if (isConnected && activeRoom?.roomId) {
            socket.emit('join-room', activeRoom.roomId);
        }
    }, [isConnected, activeRoom?.roomId]);

    if (!socket || !isAuthenticated) return null;

    const statusColor = isConnected ? 'text-green-500' : 'text-red-500';
    const statusText = isConnected ? 'Online' : 'Offline';

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
        if (isChatOpen) setActiveRoom(null); // Reset to lobby when closing
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Main Toggle Button */}
            <button
                onClick={toggleChat}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center"
            >
                {isChatOpen ? <FaChevronRight className="w-6 h-6 rotate-90" /> : <FaComments className="w-6 h-6" />}
                <FaCircle className={`absolute top-1 right-1 w-3 h-3 border-2 border-white rounded-full ${statusColor}`} />
            </button>
            
            {/* Chat Window */}
            {isChatOpen && (
                <div className="absolute bottom-20 right-0 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fade-in origin-bottom-right">
                    
                    {/* SCENARIO A: Inside a Chat Room */}
                    {activeRoom ? (
                        <ChatRoom 
                            roomId={activeRoom.roomId} 
                            otherUser={activeRoom.otherUser} 
                            closeChat={() => setActiveRoom(null)} 
                        />
                    ) : (
                        
                    /* SCENARIO B: Lobby (List of Chats or Start Button) */
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-5 bg-indigo-600 dark:bg-gray-900 text-white">
                            <h3 className="font-bold text-lg">Messages</h3>
                            <div className="flex items-center text-xs opacity-80 mt-1">
                                <FaCircle className={`w-2 h-2 mr-2 ${statusColor}`} />
                                {statusText}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-2">
                            
                            {/* --- ADMIN VIEW: List of Active Rooms --- */}
                            {user.role === 'admin' ? (
                                <>
                                    {isLoadingRooms ? (
                                        <div className="flex justify-center items-center h-40 text-gray-400">
                                            <FaSpinner className="animate-spin w-6 h-6" />
                                        </div>
                                    ) : adminRooms.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            <p>No active conversations.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {adminRooms.map(room => (
                                                <div 
                                                    key={room._id} 
                                                    onClick={() => enterRoom(room)}
                                                    className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center"
                                                >
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 rounded-full flex items-center justify-center font-bold mr-3 shrink-0">
                                                        {room.otherUser?.name?.charAt(0) || <FaUser />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {room.otherUser?.name || 'Unknown User'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {room.otherUser?.email}
                                                        </p>
                                                    </div>
                                                    <FaChevronRight className="text-gray-300 w-3 h-3" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* --- RESELLER VIEW: Start Chat Button --- */
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                                        <FaComments className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Need Help?</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Start a conversation with our admin team for support with your orders.
                                    </p>
                                    <button 
                                        onClick={startResellerChat}
                                        disabled={!isConnected}
                                        className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:bg-gray-400 disabled:shadow-none"
                                    >
                                        Start Chat
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