// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize Auth State
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            const savedUser = localStorage.getItem('user');
            
            // Check if token is the literal string "undefined" (common bug)
            if (token && token !== "undefined" && savedUser) {
                try {
                    setUser(JSON.parse(savedUser));
                    setIsAuthenticated(true);
                } catch (e) {
                    console.error("Auth parsing error", e);
                    localStorage.clear();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            
            console.log("🔍 LOGIN RESPONSE:", res.data); // Debug Log

            if (res.data.success || res.status === 200) {
                // 🛑 FIXED: SMART TOKEN HUNTING 🛑
                // We look in multiple places to avoid "undefined" errors
                const token = res.data.token || res.data.accessToken || res.data.data?.token || res.data.data?.accessToken;
                const user = res.data.user || res.data.data?.user;

                if (!token) {
                    console.error("❌ TOKEN MISSING IN RESPONSE. Server sent:", res.data);
                    return { success: false, message: "Login failed: Server did not provide a token." };
                }

                // Save VALID data only
                localStorage.setItem('accessToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                setUser(user);
                setIsAuthenticated(true);
                return { success: true, user };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login'; 
    };

    const value = { user, isAuthenticated, isLoading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};