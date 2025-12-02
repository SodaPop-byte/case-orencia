// SocketContext.jsx (ESM)
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js'; 

// 1. Create Context
export const SocketContext = createContext();

// The base WebSocket URL, defined in the .env file
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

// 2. Context Provider Component
export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            // If not authenticated, disconnect any existing socket and stop
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setIsConnected(false);
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        
        // 3. Initialize Socket Connection
        const newSocket = io(WS_URL, {
            // Pass the access token in the handshake auth object
            auth: {
                token: accessToken
            },
            // For simple setup, we also pass user data (replace with auth token extraction)
            query: {
                userId: user.id,
                userRole: user.role
            },
            transports: ['websocket'],
        });

        // 4. Set Event Listeners
        newSocket.on('connect', () => {
            console.log('Socket.io connected successfully.');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.io disconnected.');
            setIsConnected(false);
        });
        
        newSocket.on('connect_error', (err) => {
            console.error('Socket.io connection error:', err.message);
        });

        setSocket(newSocket);
        
        // Cleanup function on component unmount or dependency change
        return () => {
            newSocket.disconnect();
        };
        
    }, [isAuthenticated, user?.id, user?.role]); // Reconnect when authentication status changes

    const value = {
        socket,
        isConnected,
        // Helper function to emit events used by chat components
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