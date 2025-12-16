// src/context/SocketContext.jsx (FINAL: FIXED AUTH & HELPERS)
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext.jsx'; 

export const SocketContext = createContext();

// 1. Define URL (Prioritize WS_URL for root connection)
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 2. Safe User ID & Token Check
        const userId = user?._id || user?.id;
        
        // 🔴 FIX: Check BOTH common names for the token
        const accessToken = localStorage.getItem('token') || localStorage.getItem('accessToken');

        // Stop if not ready
        if (!isAuthenticated || !userId || !accessToken) {
            if (socket) {
                console.log("🔌 SOCKET: Disconnecting (Auth/User missing)...");
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Avoid reconnecting if already connected to the SAME user
        if (socket && socket.connected) {
            return; 
        }

        console.log(`🔌 SOCKET: Connecting to ${WS_URL} as ${user.name || 'User'}...`);

        // 3. Initialize Socket
        const newSocket = io(WS_URL, {
            auth: { token: accessToken }, // Handshake Auth
            query: { userId: userId, token: accessToken }, // Query Param Backup
            transports: ['websocket'],    // Force fast connection
            reconnection: true,           
            reconnectionAttempts: 5,
        });

        // 4. Listeners
        newSocket.on('connect', () => {
            console.log('🟢 SOCKET CONNECTED! ID:', newSocket.id);
            setIsConnected(true);
            
            // Join specific user room for notifications
            newSocket.emit('join-room', userId);
        });

        newSocket.on('connect_error', (err) => {
            console.error('🔴 SOCKET ERROR:', err.message);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('🟡 SOCKET DISCONNECTED:', reason);
            setIsConnected(false);
        });

        setSocket(newSocket);

        // Cleanup
        return () => {
            newSocket.disconnect();
        };

    }, [isAuthenticated, user?._id, user?.id]); 

    // 5. Restore Helper Functions (ChatRoom needs these!)
    const emit = (eventName, data) => {
        if (socket) socket.emit(eventName, data);
    };

    const on = (eventName, callback) => {
        if (socket) socket.on(eventName, callback);
    };

    const off = (eventName, callback) => {
        if (socket) socket.off(eventName, callback);
    };

    const value = {
        socket, 
        isConnected,
        emit, // <--- Added back
        on,   // <--- Added back
        off   // <--- Added back
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};