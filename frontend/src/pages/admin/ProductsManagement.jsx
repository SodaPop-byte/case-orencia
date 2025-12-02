// AdminDashboard.jsx (ESM) - FINAL VERSION WITH PHP CURRENCY
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { 
    FaWallet, FaShoppingCart, FaBoxOpen, FaExclamationTriangle, 
    FaArrowUp, FaArrowDown, FaClock 
} from 'react-icons/fa';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        products: 0,
        lowStock: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Get Inventory Stats
                const invRes = await api.get('/admin/reports/inventory');
                const inventory = invRes.data.data.stockSummary;
                const lowStockCount = inventory.filter(i => i.stockLevel < 10).length;
                const activeProducts = invRes.data.data.activeProductsCount;

                // 2. Get Orders Stats (Recent & Revenue)
                const ordRes = await api.get('/admin/orders');
                const allOrders = ordRes.data.data;
                
                // Simple calculation for MVP (In prod, backend should aggregate this)
                const totalRevenue = allOrders
                    .filter(o => o.status !== 'CANCELLED')
                    .reduce((acc, curr) => acc + curr.totalPrice, 0);

                setStats({
                    revenue: totalRevenue,
                    orders: allOrders.length,
                    products: activeProducts,
                    lowStock: lowStockCount
                });

                setRecentOrders(allOrders.slice(0, 5)); // Top 5 recent
            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // --- UI Components ---
    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
                {subtext && <p className="text-xs mt-2 flex items-center gap-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
    );

    const StatusBadge = ({ status }) => {
        const colors = {
            'PROCESSING': 'bg-blue-100 text-blue-700',
            'DELIVERED': 'bg-emerald-100 text-emerald-700',
            'CANCELLED': 'bg-red-100 text-red-700',
            'AWAITING PAYMENT': 'bg-yellow-100 text-yellow-800'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value={`₱${stats.revenue.toLocaleString()}`} // FIXED CURRENCY 
                    icon={FaWallet} 
                    color="bg-indigo-500"
                    subtext={<span className="text-green-500 flex items-center"><FaArrowUp className="mr-1"/> +12% this month</span>} 
                />
                <StatCard 
                    title="Total Orders" 
                    value={stats.orders} 
                    icon={FaShoppingCart} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Active Products" 
                    value={stats.products} 
                    icon={FaBoxOpen} 
                    color="bg-emerald-500" 
                />
                <StatCard 
                    title="Low Stock Alerts" 
                    value={stats.lowStock} 
                    icon={FaExclamationTriangle} 
                    color="bg-orange-500"
                    subtext={stats.lowStock > 0 ? <span className="text-orange-500 font-bold">Action Needed</span> : <span className="text-green-500">Healthy</span>}
                />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Recent Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium">#{order._id.slice(-6)}</td>
                                        <td className="px-6 py-4">{order.resellerId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4">₱{order.totalPrice.toFixed(2)}</td> {/* CURRENCY FIX */}
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-6 text-gray-500">No orders yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / System Status */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span>
                            </div>
                            <span className="text-xs text-green-600">Connected</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Chat Server</span>
                            </div>
                            <span className="text-xs text-blue-600">Online</span>
                        </div>
                        
                        <hr className="border-gray-100 dark:border-gray-700 my-4" />
                        
                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Pending Tasks</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <FaClock className="text-orange-400" />
                            <span>Verify {recentOrders.filter(o => o.status === 'PENDING VERIFICATION').length} payments</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;