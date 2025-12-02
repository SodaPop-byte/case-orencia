// AuthContext.jsx (ESM)
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api.js'; 
import { useNavigate } from 'react-router-dom'; 

// 1. Create Context
export const AuthContext = createContext();

// Function to decode user data from a token (basic implementation)
const decodeToken = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        return {
            id: payload.id,
            role: payload.role,
            exp: payload.exp * 1000 // Convert to milliseconds
        };
    } catch (e) {
        return null;
    }
};

// 2. Context Provider Component
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    
    // User state: stores id, role, and potentially name/email
    const [user, setUser] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);

    // Effect to check local storage and validate token on load
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const decoded = decodeToken(accessToken);
            if (decoded && decoded.exp > Date.now()) {
                // Token is valid/fresh enough, set user (we assume basic user data is available after login)
                // In a production app, you'd make a /profile API call here.
                setUser({ id: decoded.id, role: decoded.role });
            } else {
                // Token expired or invalid, clear storage
                localStorage.removeItem('accessToken');
            }
        }
        setIsLoading(false);
    }, []);

    // ----------------------------------------------------
    // AUTH ACTIONS
    // ----------------------------------------------------

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user: userData, accessToken } = response.data.data;
            
            // Store the new access token (required by api.js interceptor)
            localStorage.setItem('accessToken', accessToken);
            
            // Set user state
            setUser(userData);
            
            // Redirect based on role
            if (userData.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/reseller/catalog');
            }
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed. Check credentials.' 
            };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await api.post('/auth/register', { name, email, password, role: 'reseller' });
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registration failed.' 
            };
        }
    };

    const logout = async () => {
        try {
            // Call backend endpoint to clear httpOnly cookie
            await api.post('/auth/logout'); 
        } catch (error) {
            console.warn('Logout warning: Backend cookie clear failed.');
        } finally {
            localStorage.removeItem('accessToken');
            setUser(null);
            navigate('/login');
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isReseller: user?.role === 'reseller'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};