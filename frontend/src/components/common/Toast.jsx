// Toast.jsx (ESM)
import React, { useEffect } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, onClose }) => {
    // Auto-close after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
            <div className="bg-gray-900/90 backdrop-blur-md text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-gray-700/50">
                <FaCheckCircle className="text-emerald-400 w-5 h-5" />
                <span className="font-medium text-sm">{message}</span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default Toast;