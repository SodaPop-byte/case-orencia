// src/layouts/AdminDashboardLayout.jsx (FIXED: REMOVED BROKEN AUDIO IMPORT)
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx'; 
import api from '../utils/api.js';

// Widgets
import ChatWidget from '../components/common/ChatWidget.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx'; 

import { 
    FaChartPie, FaBox, FaClipboardList, FaWarehouse, FaChartLine, 
    FaSignOutAlt, FaBars, FaTimes, FaCog, FaBell, FaInfoCircle, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';

const AdminDashboardLayout = () => {
    const { logout } = useAuth();
    const { socket } = useSocket(); 
    const location = useLocation();
    const navigate = useNavigate();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // 1. Fetch History on Load
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications');
            setNotifications(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // 2. ⚡ REAL-TIME LISTENER ⚡
    useEffect(() => {
        if (!socket) return;

        const handleNewNotif = (data) => {
            console.log("🔔 REAL-TIME NOTIFICATION RECEIVED:", data);
            
            // Optional: If you add a file named 'beep.mp3' to your PUBLIC folder later, 
            // you can uncomment this line to play sound:
            // new Audio('/beep.mp3').play().catch(() => {});

            // Force Update State immediately
            setNotifications(prev => {
                // Remove potential duplicate if ID exists
                const filtered = prev.filter(n => n._id !== data._id);
                return [data, ...filtered];
            });
        };

        socket.on('notification', handleNewNotif);
        
        // Cleanup listener on unmount
        return () => {
            socket.off('notification', handleNewNotif);
        };
    }, [socket]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // --- 🔔 HANDLE BELL CLICK (Mark Read) ---
    const handleBellClick = async () => {
        setShowNotifDropdown(!showNotifDropdown);
        
        // Only mark read if there are unread items and we are OPENING the dropdown
        if (unreadCount > 0 && !showNotifDropdown) {
            
            // 1. Visual Update (Instant)
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

            // 2. Backend Update (Persist)
            try { 
                await api.put('/admin/notifications/mark-read'); 
            } catch (err) { 
                console.error("Failed to mark notifications read:", err);
            }
        }
    };

    // --- 🚀 HANDLE ITEM CLICK ---
    const handleNotificationItemClick = (notification) => {
        setShowNotifDropdown(false); 
        
        if (notification.type === 'NEW_ORDER' || notification.type === 'PAYMENT_PROOF') {
            navigate('/admin/orders'); 
        } else if (notification.type === 'LOW_STOCK') {
            navigate('/admin/inventory');
        } else {
            navigate('/admin/dashboard');
        }
    };

    const getNotifIcon = (type) => {
        if (type === 'NEW_ORDER') return <FaClipboardList className="text-blue-500" />;
        if (type === 'PAYMENT_PROOF') return <FaCheckCircle className="text-green-500" />;
        if (type === 'LOW_STOCK') return <FaExclamationCircle className="text-orange-500" />;
        return <FaInfoCircle className="text-gray-400" />;
    };

    // Navigation Items
    const navItems = [
        { name: 'Overview', path: '/admin/dashboard', icon: FaChartPie },
        { name: 'Products', path: '/admin/products', icon: FaBox },
        { name: 'Inventory', path: '/admin/inventory', icon: FaWarehouse },
        { name: 'Orders', path: '/admin/orders', icon: FaClipboardList },
        { name: 'Reports', path: '/admin/reports', icon: FaChartLine },
        { name: 'Settings', path: '/admin/settings', icon: FaCog },
    ];

    const NavLink = ({ item }) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
            <Link to={item.path} onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col border-r border-gray-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center px-8 border-b border-gray-800">
                    <span className="text-xl font-bold">Casa Orencia</span>
                    <button className="ml-auto lg:hidden" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => <NavLink key={item.name} item={item} />)}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg"><FaSignOutAlt /> Sign Out</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 relative">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden dark:text-white"><FaBars /></button>
                    <span className="font-bold dark:text-white">Dashboard</span>
                    
                    <div className="flex items-center gap-4">
                        {/* 🔔 BELL ICON */}
                        <div className="relative">
                            <button onClick={handleBellClick} className="relative p-2 text-gray-500 hover:text-indigo-600 transition outline-none">
                                <FaBell className={`w-6 h-6 ${unreadCount > 0 ? 'text-indigo-600' : ''}`} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-bounce border border-white dark:border-gray-800">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* 🔔 DROPDOWN */}
                            {showNotifDropdown && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-fadeIn">
                                    <div className="p-4 border-b dark:border-gray-600 font-bold text-sm dark:text-white flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && <span className="text-xs font-normal text-indigo-500">{unreadCount} unread</span>}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                                                <FaBell className="text-gray-300 text-2xl" />
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map((n, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => handleNotificationItemClick(n)}
                                                    className={`p-4 border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition cursor-pointer flex gap-3 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                >
                                                    <div className="mt-1 shrink-0">{getNotifIcon(n.type)}</div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-semibold dark:text-white mb-0.5">{n.title}</p>
                                                            {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5"></div>}
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{n.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-600 text-center">
                                        <button onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                                            View All Activity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <Outlet />
                </main>
            </div>
            
            <ChatWidget />
        </div>
    );
};

export default AdminDashboardLayout;