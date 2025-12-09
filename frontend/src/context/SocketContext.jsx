// SocketContext.jsx (ESM) - FINAL AUTHENTICATION FIX
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js'; 

export const SocketContext = createContext();

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Get Token immediately
        const accessToken = localStorage.getItem('accessToken');

        // 2. CRITICAL CHECK: Do not connect if no token or no user
        if (!isAuthenticated || !user || !accessToken) {
            if (socket) {
                console.log("Disconnecting socket (No auth)...");
                socket.disconnect();
                setSocket(null);
            }
            setIsConnected(false);
            return;
        }

        console.log(`[Socket] Initializing connection for ${user.name}...`);

        // 3. Initialize Socket with Token
        const newSocket = io(WS_URL, {
            auth: {
                token: accessToken // Send the token here
            },
            query: {
                userId: user.id,
                userRole: user.role
            },
            transports: ['websocket'],
            autoConnect: true
        });

        newSocket.on('connect', () => {
            console.log('[Socket] Connected ✅ ID:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected ❌:', reason);
            setIsConnected(false);
        });
        
        newSocket.on('connect_error', (err) => {
            console.error('[Socket] Connection Error ⚠️:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
        
    }, [isAuthenticated, user?.id]); // Re-run only if Auth changes

    const value = {
        socket,
        isConnected,
        emit: (event, data) => socket?.emit(event, data),
        on: (event, callback) => socket?.on(event, callback),
        off: (event, callback) => socket?.off(event, callback),
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