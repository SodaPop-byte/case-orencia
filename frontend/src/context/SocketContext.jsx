// src/context/SocketContext.jsx (FINAL: ROBUST & ID-SAFE)
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext.jsx'; // Ensure path is correct

export const SocketContext = createContext();

// 1. Define URL (Safe Fallback)
const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 2. Safe User ID Check (Handles _id vs id)
        const userId = user?._id || user?.id;
        const accessToken = localStorage.getItem('accessToken');

        // Stop if not ready
        if (!isAuthenticated || !userId || !accessToken) {
            if (socket) {
                console.log("🔌 SOCKET: Disconnecting (Auth/User missing)...");
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Avoid reconnecting if we are already connected to the SAME user
        if (socket && socket.connected) {
            return; 
        }

        console.log(`🔌 SOCKET: Connecting as ${user.name} (${userId})...`);

        // 3. Initialize Socket
        const newSocket = io(WS_URL, {
            auth: { token: accessToken }, // Send token for auth
            query: { userId: userId },    // Send ID for room targeting
            transports: ['websocket'],    // Force fast connection
            reconnection: true,           // Ensure it tries to come back if lost
            reconnectionAttempts: 5,
        });

        // 4. Listeners
        newSocket.on('connect', () => {
            console.log('🟢 SOCKET CONNECTED! ID:', newSocket.id);
            setIsConnected(true);
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

    // 🛑 CRITICAL FIX: Depend on the correct ID field
    }, [isAuthenticated, user?._id, user?.id]); 

    const value = {
        socket,
        isConnected
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