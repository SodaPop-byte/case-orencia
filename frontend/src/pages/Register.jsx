// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import api from '../utils/api.js'; // Import API for the send-otp call

const Register = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // OTP States
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // 🟢 Send OTP Logic
    const handleSendOtp = async () => {
        if (!email || !email.includes('@')) {
            setError("Please enter a valid email first.");
            return;
        }
        try {
            setError('');
            const res = await api.post('/auth/send-otp', { email });
            if (res.data.success) {
                setOtpSent(true);
                setSuccessMessage("OTP code sent to server console!");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Basic Validations
        if (!name || !email || !password || !otp) {
             setError('All fields including OTP are required.');
             return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // 🟢 Call Register with OTP
        const result = await register(name, email, password, otp);

        if (result.success) {
            setSuccessMessage(result.message);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
                <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">
                    Create Account
                </h1>
                
                {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{successMessage}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
                    </div>

                    {/* Email + Send OTP Button */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <div className="flex gap-2">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required disabled={otpSent} />
                            
                            <button type="button" onClick={handleSendOtp} disabled={otpSent || !email}
                                className={`px-4 py-2 rounded-lg text-white font-medium ${otpSent ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {otpSent ? "Sent ✓" : "Send Code"}
                            </button>
                        </div>
                    </div>

                    {/* OTP Input (Shown after sending) */}
                    {otpSent && (
                        <div className="animate-fade-in-down">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code (Check Console)</label>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code"
                                className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" required />
                        </div>
                    )}

                    {/* Passwords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
                    </div>

                    <button type="submit" disabled={isLoading}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                        {isLoading ? 'Creating Account...' : 'Verify & Register'}
                    </button>
                </form>
                
                <div className="text-center text-sm">
                   <Link to="/login" className="text-indigo-600 hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;