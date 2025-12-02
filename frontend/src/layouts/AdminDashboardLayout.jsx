// AdminDashboardLayout.jsx (ESM) - FINAL MERGED VERSION (Notifications + Dark Mode)
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js'; 
import ChatWidget from '../components/common/ChatWidget.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx'; 
import { 
    FaChartPie, FaBox, FaClipboardList, FaWarehouse, FaChartLine, 
    FaSignOutAlt, FaBars, FaTimes, FaCog, FaBell 
} from 'react-icons/fa';

const AdminDashboardLayout = () => {
    const { user, logout } = useAuth();
    const { socket, on, off } = useSocket(); 
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // --- LISTEN FOR NEW ORDERS ---
    useEffect(() => {
        const handleNewOrder = (data) => {
            // Add to list
            setNotifications(prev => [{
                id: Date.now(),
                text: `${data.customer} placed an order for ₱${data.amount.toFixed(2)}`,
                link: '/admin/orders',
                isRead: false
            }, ...prev]);
        };

        if (socket) {
            socket.on('new-order-notification', handleNewOrder);
        }

        return () => {
            if (socket) socket.off('new-order-notification', handleNewOrder);
        };
    }, [socket]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = () => {
        setShowNotifDropdown(!showNotifDropdown);
        // Mark all as read when opening
        if (!showNotifDropdown && unreadCount > 0) {
             setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

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
            <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
            >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                <span className="font-medium">{item.name}</span>
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            {/* Sidebar Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static flex flex-col border-r border-gray-800
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-20 flex items-center px-8 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
                        <span className="text-xl font-bold tracking-tight">Case Orencia</span>
                    </div>
                    <button className="ml-auto lg:hidden text-gray-400" onClick={() => setIsSidebarOpen(false)}>
                        <FaTimes />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4 mt-4">Menu</div>
                    {navItems.map((item) => <NavLink key={item.name} item={item} />)}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400 truncate">Administrator</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 relative">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 lg:hidden"><FaBars className="w-6 h-6" /></button>
                    <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">Dashboard</span>
                    
                    <div className="flex items-center gap-4 ml-auto">
                        {/* --- NOTIFICATION BELL --- */}
                        <div className="relative">
                            <button onClick={handleNotificationClick} className="p-2 text-gray-500 hover:text-indigo-600 transition relative">
                                <FaBell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifDropdown && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 z-50 overflow-hidden">
                                    <div className="p-3 border-b dark:border-gray-600 font-bold text-sm text-gray-700 dark:text-gray-200">Notifications</div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="p-4 text-sm text-gray-500 text-center">No new notifications</p>
                                        ) : (
                                            notifications.map(n => (
                                                <Link to={n.link} key={n.id} className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-0">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{n.text}</p>
                                                    <p className="text-xs text-gray-400 mt-1">Just now</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- THEME TOGGLE --- */}
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            <ChatWidget />
        </div>
    );
};

export default AdminDashboardLayout;