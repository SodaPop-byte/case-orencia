// api.js (ESM) - FINAL & ROBUST VERSION
import axios from 'axios';

// The base URL for the Render backend API
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create a custom Axios instance
const api = axios.create({
    baseURL,
    withCredentials: true, // Crucial for sending/receiving httpOnly cookies (refresh token)
    // Header removal is correct: it allows FormData to work properly.
});

// Request Interceptor: Attach the Access Token and Content-Type
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken'); 

        // 🛑 DEBUG LOG 🛑
        console.log("Axios Interceptor Check:", token ? `Token Found (Length: ${token.length})` : "Token MISSING from localStorage");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 🛠️ FIX: Manually re-add 'Content-Type: application/json' for non-file POST/PUT/PATCH requests
        // This ensures the backend receives JSON data correctly and validates the token.
        const isJsonMethod = ['post', 'put', 'patch'].includes(config.method);
        const isNotFormData = !(config.data instanceof FormData);
        
        if (isJsonMethod && isNotFormData) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handles token expiration (401 response) and automatic refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) { // Added safe chaining ?.
            originalRequest._retry = true;
            try {
                // Use plain axios to avoid infinite interceptor loop on refresh endpoint
                const { data } = await axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });
                
                localStorage.setItem('accessToken', data.data.accessToken);
                
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Refresh Token Failed. User must log in.");
                // Optionally clear storage and redirect here if context doesn't handle it
                return Promise.reject(refreshError); 
            }
        }
        return Promise.reject(error);
    }
);

export default api;