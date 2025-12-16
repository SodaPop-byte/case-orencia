// Login.jsx (ESM) - FINAL CORRECTED VERSION
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom'; // ⬅️ ADD useNavigate
import { useAuth } from '../hooks/useAuth.js';

const Login = () => {
    const navigate = useNavigate(); // ⬅️ INITIALIZE useNavigate hook
    const { login, isAuthenticated, isLoading, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            // FIX: Use the user object returned from the context (or existing user state)
            const role = result.user?.role || user?.role; 

            if (role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (role === 'reseller') {
                // 🛑 CORRECT DESTINATION 🛑
                navigate('/reseller/catalog', { replace: true }); 
            }
            // If role is undefined, we simply stay on the login page (or let the check below handle it)
        } else {
            setError(result.message);
        }
    };

    // -----------------------------------------------------------
    // Redirection for users already logged in (e.g., page refresh)
    // -----------------------------------------------------------
    if (isAuthenticated && !isLoading && user) {
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (user.role === 'reseller') {
            // 🛑 CORRECT DESTINATION 🛑
            return <Navigate to="/reseller/catalog" replace />;
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-6">
                <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400">
                    Case Orencia Login
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400">
                    Sign in to your account.
                </p>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 rounded text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-white transition duration-150 shadow-md ${
                            isLoading 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {isLoading ? 'Signing In...' : 'Login'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Register as Reseller
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;