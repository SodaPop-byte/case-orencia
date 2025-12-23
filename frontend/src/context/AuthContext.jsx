import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Initialize (Check if already logged in)
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser && token !== "undefined") {
            try {
                setUser(JSON.parse(savedUser));
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.clear();
            }
        }
        setIsLoading(false);
    }, []);

    // 2. Login Function (The Fix)
    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            
            // 🔍 DEBUG: Check what came back
            console.log("LOGIN RESPONSE:", res.data);

            if (res.data.success) {
                // 🟢 EXTRACT DATA CORRECTLY
                // Based on controller: { data: { user, accessToken } }
                const token = res.data.data?.accessToken; 
                const userData = res.data.data?.user;

                if (!token) {
                    console.error("❌ Token missing in response:", res.data);
                    return { success: false, message: "Login failed: No token received." };
                }

                // Save
                localStorage.setItem('accessToken', token);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Update State
                setUser(userData);
                setIsAuthenticated(true);

                return { success: true, user: userData };
            }
            return { success: false, message: res.data.message };

        } catch (error) {
            console.error("Login Request Failed:", error);
            const msg = error.response?.data?.message || 'Server error during login';
            return { success: false, message: msg };
        }
    };

    // 3. Register Function (With OTP support)
    const register = async (name, email, password, otp) => {
        try {
            const res = await api.post('/auth/register', { name, email, password, otp });
            if (res.data.success) {
                return { success: true, message: 'Registration successful!' };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    // 4. Logout
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login';
    };

    const value = { user, isAuthenticated, isLoading, login, logout, register };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};