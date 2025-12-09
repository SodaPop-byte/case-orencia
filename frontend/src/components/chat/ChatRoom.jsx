// ChatRoom.jsx (ESM) - FINAL FIX: LIVE RECEIVING & MESSAGE IDENTITY
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useSocket } from '../../hooks/useSocket.js';
import api from '../../utils/api.js';
import { FaPaperPlane, FaTimes, FaCircle } from 'react-icons/fa';

const ChatRoom = ({ roomId, otherUser, closeChat }) => {
    const { user } = useAuth();
    const { socket, emit, on, off, isConnected } = useSocket();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // --- 1. Fetch History ---
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/messages/${roomId}?limit=50`);
                setMessages(response.data.data);
                if (isConnected) emit('mark-seen', { roomId }); 
            } catch (err) {
                console.error("Error fetching chat history:", err);
            }
        };

        if (roomId) {
            setMessages([]);
            fetchHistory();
        }
    }, [roomId, isConnected]); // Added isConnected to force refresh history on reconnect

    // --- 2. Socket Listeners (CRITICAL for live receiving) ---
    useEffect(() => {
        const handleNewMessage = (message) => {
            if (message.chatRoomId === roomId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                
                if (message.senderId !== user.id) {
                    emit('mark-seen', { roomId });
                }
            }
        };

        const handleTyping = (data) => {
            if (data.senderId === otherUser._id) {
                setIsTyping(data.isTyping);
            }
        };

        // Attach listeners
        on('new-message', handleNewMessage);
        on('typing', handleTyping);

        // Clean up listeners when component unmounts or dependencies change
        return () => {
            off('new-message', handleNewMessage);
            off('typing', handleTyping);
        };
    // CRITICAL FIX: The dependency array must include all values used in the handler and emitted
    }, [roomId, otherUser._id, user.id, on, off, emit, isConnected]); 
    
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- 3. Send Message Logic ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected) return;
        
        emit('send-message', { 
            roomId, 
            content: input.trim(), 
            receiverId: otherUser._id 
        });
        
        emit('typing', { roomId, isTyping: false });
        setInput('');
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (e.target.value.length > 0) emit('typing', { roomId, isTyping: true });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 font-sans">
            <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                            {otherUser.name?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-700"></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {otherUser.name || 'User'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {otherUser.role || 'Chat'}
                        </p>
                    </div>
                </div>
                <button onClick={closeChat} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                    <FaTimes className="w-4 h-4" />
                </button>
            </header>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg) => {
                    // FIX: Use toString() for safe comparison between ObjectId and String ID
                    const isMine = msg.senderId.toString() === user.id.toString(); 
                    return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                isMine 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'
                            }`}>
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right opacity-70 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    );
                })}
                
                {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 ml-2 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        <span>typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                {!isConnected && (
                    <div className="text-center text-xs text-red-500 mb-2 flex items-center justify-center gap-1">
                        <FaCircle className="w-2 h-2" /> Connecting...
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        disabled={!isConnected}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition outline-none dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !input.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-md"
                    >
                        <FaPaperPlane className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatRoom;