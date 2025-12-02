// ResellerLayout.jsx (ESM) - FINAL WITH DARK MODE TOGGLE
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../context/CartContext.jsx';
import ChatWidget from '../components/common/ChatWidget.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx'; // NEW IMPORT
import { FaShoppingCart, FaSignOutAlt, FaBoxOpen, FaHistory, FaBars, FaTimes } from 'react-icons/fa';

const ResellerLayout = () => {
    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Catalog', path: '/reseller/catalog', icon: FaBoxOpen }, 
        { name: 'My Orders', path: '/reseller/orders', icon: FaHistory },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        
                        {/* Left: Logo */}
                        <div className="flex items-center">
                            <Link to="/reseller/catalog" className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Case Orencia</span>
                            </Link>
                        </div>

                        {/* Center: Desktop Nav Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navLinks.map((link) => {
                                const isActive = location.pathname.startsWith(link.path);
                                return (
                                    <Link 
                                        key={link.name}
                                        to={link.path} 
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                                            isActive 
                                                ? 'text-primary-600 dark:text-primary-400' 
                                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                    >
                                        <link.icon className={isActive ? 'text-primary-600' : ''} />
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right: Actions (Desktop) */}
                        <div className="hidden md:flex items-center space-x-4">
                            {/* --- THEME TOGGLE (New) --- */}
                            <ThemeToggle />
                            
                            <Link to="/reseller/checkout" className="relative group p-2 text-gray-500 hover:text-primary-600 transition dark:text-gray-400 dark:hover:text-primary-400">
                                <FaShoppingCart className="w-6 h-6" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm group-hover:scale-110 transition">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>

                            <div className="flex items-center gap-3 border-l pl-6 border-gray-200 dark:border-gray-700 ml-2">
                                <button 
                                    onClick={logout} 
                                    className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Sign Out"
                                >
                                    <FaSignOutAlt className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Actions (Mobile) */}
                        <div className="flex items-center gap-4 md:hidden">
                            {/* --- THEME TOGGLE (Mobile) --- */}
                            <ThemeToggle />

                            <Link to="/reseller/checkout" className="relative p-2 text-gray-600 dark:text-gray-300">
                                <FaShoppingCart className="w-6 h-6" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
                                {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-4 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <link.icon /> {link.name}
                                </Link>
                            ))}
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-4 text-left text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <FaSignOutAlt /> Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-fade-in">
                    <Outlet /> 
                </div>
            </main>
            
            <ChatWidget />
        </div>
    );
};

export default ResellerLayout;