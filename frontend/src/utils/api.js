// api.js (ESM)
import axios from 'axios';

// The base URL for the Render backend API
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create a custom Axios instance
const api = axios.create({
    baseURL,
    withCredentials: true, // Crucial for sending/receiving httpOnly cookies (refresh token)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach the Access Token to every outgoing request
api.interceptors.request.use(
    (config) => {
        // Retrieve token from localStorage/Context (assuming we store it there temporarily)
        const token = localStorage.getItem('accessToken'); 
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        
        // If the error is 401 and it's not the refresh token endpoint, attempt refresh
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Call the refresh token endpoint. The backend handles the httpOnly cookie.
                const { data } = await axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });
                
                // Store the new access token
                localStorage.setItem('accessToken', data.data.accessToken);
                
                // Update the header of the failed request and retry
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails (e.g., refresh token expired), redirect to login
                console.error("Refresh Token Failed. User must log in.");
                // Note: Redirect logic is handled inside AuthContext for clarity
                return Promise.reject(refreshError); 
            }
        }
        return Promise.reject(error);
    }
);

export default api;