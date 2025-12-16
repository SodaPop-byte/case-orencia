// src/utils/api.js
import axios from 'axios';

// 1. Create the Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for cookies/cors
});

// 2. Request Interceptor (Automatically attach Token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Response Interceptor (Handle Invalid Tokens Automatically)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the server says "401 Unauthorized" (Invalid Token)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. Logging out...");
            
            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            
            // Redirect to login page (unless we are already there)
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;