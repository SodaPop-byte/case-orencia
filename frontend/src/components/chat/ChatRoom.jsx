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

    // --- 1. Join Room & Fetch History ---
    useEffect(() => {
        if (!roomId || !isConnected) return;

        // Force Join Room
        emit('join-room', roomId);

        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/messages/${roomId}?limit=50`);
                setMessages(response.data.data);
                emit('mark-seen', { roomId }); 
            } catch (err) {
                console.error("History Error:", err);
            }
        };

        // Reset and fetch
        setMessages([]); 
        fetchHistory();
    }, [roomId, isConnected]);

    // --- 2. Live Listener (The "Receiver") ---
    useEffect(() => {
        const handleNewMessage = (message) => {
            console.log("🔥 RECEIVED MESSAGE:", message);

            setMessages(prev => {
                // A. Prevent Duplicates
                if (prev.some(m => m._id === message._id)) return prev;

                // B. Handle "Optimistic" Replacement (When server echoes back)
                // If we find a temporary message that matches this real one, replace it.
                const isOptimistic = prev.some(m => 
                    m.isOptimistic && 
                    m.content === message.content && 
                    (m.senderId === user.id || m.senderId._id === user.id)
                );
                
                if (isOptimistic) {
                    return prev.map(m => 
                        (m.isOptimistic && m.content === message.content) ? message : m
                    );
                }

                return [...prev, message];
            });
            
            // Mark seen if it's from the other person
            const msgSenderId = message.senderId?._id || message.senderId;
            if (msgSenderId !== user.id) {
                emit('mark-seen', { roomId });
            }
        };

        const handleTyping = (data) => {
            if (data.senderId === otherUser._id) setIsTyping(data.isTyping);
        };

        // Listen
        on('new_message', handleNewMessage);
        on('typing', handleTyping);

        // Cleanup
        return () => {
            off('new_message', handleNewMessage);
            off('typing', handleTyping);
        };
    }, [roomId, user.id, otherUser._id]); 
    
    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- 3. Send Message (The "Instant" Fix) ---
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected) return;
        
        const contentText = input.trim();
        setInput(''); // Clear input instantly
        emit('typing', { roomId, isTyping: false });

        // 🟢 INSTANT UPDATE: Add message to screen immediately (Fake it)
        const optimisticMsg = {
            _id: Date.now().toString(), // Temporary ID
            content: contentText,
            senderId: user, // Show as "Me"
            chatRoomId: roomId,
            createdAt: new Date().toISOString(),
            isOptimistic: true // Flag to track it
        };

        setMessages(prev => [...prev, optimisticMsg]);

        // 🔵 SERVER UPDATE: Send to backend
        emit('send-message', { 
            roomId, 
            content: contentText, 
            receiverId: otherUser._id 
        });
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (e.target.value.length > 0) emit('typing', { roomId, isTyping: true });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 font-sans">
            {/* Header */}
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
                    const msgSenderId = msg.senderId?._id || msg.senderId;
                    // Handle case where senderId is an object (Optimistic) or string (Database)
                    const senderIdString = (typeof msgSenderId === 'object') ? msgSenderId._id : msgSenderId;
                    
                    const isMine = senderIdString?.toString() === user.id?.toString(); 

                    return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                isMine 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'
                            } ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right opacity-70 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {msg.isOptimistic && <span className="ml-1 italic">...</span>}
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