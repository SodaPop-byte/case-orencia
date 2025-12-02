// AdminDashboard.jsx (ESM) - FINAL COMPLETE (Charts, PHP, Quick Actions)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Needed for buttons
import api from '../../utils/api.js';
import { 
    FaWallet, FaShoppingCart, FaBoxOpen, FaExclamationTriangle, 
    FaArrowUp, FaClock, FaPlus, FaWarehouse 
} from 'react-icons/fa';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate(); // Hook for Quick Actions
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, lowStock: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Get Inventory
                const invRes = await api.get('/admin/reports/inventory');
                const inventory = invRes.data?.data?.stockSummary || [];
                const activeProducts = invRes.data?.data?.activeProductsCount || 0;
                const lowStockCount = inventory.filter(i => i.stockLevel < 10).length;

                // 2. Get Orders
                const ordRes = await api.get('/admin/orders');
                const allOrders = Array.isArray(ordRes.data?.data) ? ordRes.data.data : [];
                
                const totalRevenue = allOrders
                    .filter(o => o.status !== 'CANCELLED')
                    .reduce((acc, curr) => acc + curr.totalPrice, 0);

                // 3. Prepare Chart Data
                const salesMap = {};
                allOrders.forEach(order => {
                    if (order.status !== 'CANCELLED') {
                        const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        salesMap[date] = (salesMap[date] || 0) + order.totalPrice;
                    }
                });
                const salesChartData = Object.keys(salesMap).map(date => ({ name: date, sales: salesMap[date] })).reverse().slice(-7);

                const categoryData = inventory.map(item => ({
                    name: item.itemName.charAt(0).toUpperCase() + item.itemName.slice(1),
                    value: item.stockLevel
                }));

                setStats({ revenue: totalRevenue, orders: allOrders.length, products: activeProducts, lowStock: lowStockCount });
                setRecentOrders(allOrders.slice(0, 5));
                setChartData(salesChartData);
                setPieData(categoryData);

            } catch (err) {
                console.error("Dashboard Load Error:", err);
                setError('Failed to load dashboard data.');
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
            'PROCESSING': 'bg-blue-100 text-blue-700', 'DELIVERED': 'bg-emerald-100 text-emerald-700',
            'CANCELLED': 'bg-red-100 text-red-700', 'AWAITING PAYMENT': 'bg-yellow-100 text-yellow-800'
        };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>;
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header with Quick Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                
                {/* --- QUICK ACTION BUTTONS (Restored) --- */}
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/admin/inventory')} 
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <FaWarehouse className="text-indigo-600" /> Manage Stock
                    </button>
                    <button 
                        // Pass 'state' so the product modal opens automatically
                        onClick={() => navigate('/admin/products', { state: { openCreate: true } })} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <FaPlus /> Add Product
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`₱${stats.revenue.toLocaleString()}`} icon={FaWallet} color="bg-indigo-500" subtext={<span className="text-green-500 flex items-center"><FaArrowUp className="mr-1"/> Sales</span>} />
                <StatCard title="Total Orders" value={stats.orders} icon={FaShoppingCart} color="bg-blue-500" />
                <StatCard title="Active Products" value={stats.products} icon={FaBoxOpen} color="bg-emerald-500" />
                <StatCard title="Low Stock Alerts" value={stats.lowStock} icon={FaExclamationTriangle} color="bg-orange-500" subtext={stats.lowStock > 0 ? <span className="text-orange-500 font-bold">Action Needed</span> : <span className="text-green-500">Healthy</span>} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Sales Trend</h3>
                    <div className="h-72 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => [`₱${value.toLocaleString()}`, 'Sales']} />
                                    <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">No sales data yet.</div>}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Inventory By Type</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Recent Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                                <tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Customer</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium">#{order._id.slice(-6).toUpperCase()}</td>
                                        <td className="px-6 py-4">{order.resellerId?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4">₱{order.totalPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && <tr><td colSpan="4" className="text-center py-6 text-gray-500">No orders yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-sm font-medium text-green-700 dark:text-green-400">Database</span></div>
                            <span className="text-xs text-green-600">Connected</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div><span className="text-sm font-medium text-blue-700 dark:text-blue-400">Chat Server</span></div>
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