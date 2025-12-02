// OrderHistory.jsx (ESM) - FULL RESTORED VERSION (No code removed)
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { 
    FaSyncAlt, FaTimesCircle, FaEye, FaTimes, 
    FaBox, FaMapMarkerAlt, FaShippingFast, FaUser 
} from 'react-icons/fa';

// --- HELPERS ---
const calculateTotalItems = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

const StatusBadge = ({ status }) => {
    const styles = {
        'AWAITING PAYMENT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'PENDING VERIFICATION': 'bg-orange-100 text-orange-800 border-orange-200',
        'PROCESSING': 'bg-blue-100 text-blue-800 border-blue-200',
        'SHIPPED': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'DELIVERED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'CANCELLED': 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
        <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

// --- MAIN COMPONENT ---
const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cancelOrderId, setCancelOrderId] = useState(null); 

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/reseller/orders');
            setOrders(response.data.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // --- ACTIONS ---
    const executeCancel = async () => {
        if (!cancelOrderId) return;
        const orderId = cancelOrderId;
        setCancelOrderId(null); // Close confirm modal

        try {
            await api.put(`/reseller/orders/${orderId}/cancel`);
            fetchOrders();
            // If the details modal is open for this order, close it too
            if (selectedOrder?._id === orderId) setIsModalOpen(false);
        } catch (err) {
            alert('Cancellation failed. Order may already be processed.');
        }
    };

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };


    // --- MODAL: ORDER DETAILS ---
    const OrderDetailModal = () => {
        if (!isModalOpen || !selectedOrder) return null;

        const isCancellable = ['AWAITING PAYMENT', 'PENDING VERIFICATION'].includes(selectedOrder.status);
        const isShipped = ['SHIPPED', 'DELIVERED'].includes(selectedOrder.status);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="px-8 py-5 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Order #{selectedOrder._id.slice(-6).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-8 overflow-y-auto">
                        
                        {/* 1. Status Bar */}
                        <div className="flex justify-between items-center mb-8 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Current Status</span>
                                <StatusBadge status={selectedOrder.status} />
                            </div>
                            {isCancellable && (
                                <button 
                                    onClick={() => { setIsModalOpen(false); setCancelOrderId(selectedOrder._id); }} 
                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition shadow-sm"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>

                        {/* 2. Tracking Info (Visible only if Shipped) */}
                        {isShipped && (
                            <div className="mb-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-full">
                                        <FaShippingFast className="text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                    <span className="font-bold text-lg">Your order is on the way!</span>
                                </div>
                                <div className="ml-11">
                                    <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80 mb-1">Tracking Number:</p>
                                    <p className="font-mono text-lg font-bold tracking-wide select-all">
                                        {selectedOrder.trackingNumber || 'ID Not Available'}
                                    </p>
                                    <p className="text-xs text-indigo-800/60 dark:text-indigo-300/60 mt-2">
                                        Shipped: {selectedOrder.shippingDate ? new Date(selectedOrder.shippingDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 3. Shipping Address */}
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaMapMarkerAlt /> Shipping Details
                            </h4>
                            <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                                <p className="font-bold text-base mb-1">{selectedOrder.shippingAddress.contactInfo}</p>
                                <p>{selectedOrder.shippingAddress.street}</p>
                                <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.zipCode}</p>
                            </div>
                        </div>

                        {/* 4. Items Table */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaBox /> Items Ordered
                            </h4>
                            <div className="border rounded-xl dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3 text-right">Qty</th>
                                            <th className="px-6 py-3 text-right">Price</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selectedOrder.items.map((item, idx) => (
                                            <tr key={idx} className="bg-white dark:bg-gray-800">
                                                <td className="px-6 py-4 font-medium dark:text-white">
                                                    {item.name}
                                                    <span className="block text-xs text-gray-400 mt-0.5">{item.SKU}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right dark:text-gray-300">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-gray-500">₱{item.priceAtTimeOfOrder.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold dark:text-white">
                                                    ₱{(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        
                                        {/* Shipping Fee Row */}
                                        <tr className="bg-gray-50 dark:bg-gray-700/30">
                                            <td colSpan="3" className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Shipping Fee</td>
                                            <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                ₱{(selectedOrder.shippingFee || 0).toFixed(2)}
                                            </td>
                                        </tr>

                                        {/* Grand Total Row */}
                                        <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                                            <td colSpan="3" className="px-6 py-4 text-right font-bold text-indigo-900 dark:text-indigo-200 uppercase text-xs tracking-wider">Grand Total</td>
                                            <td className="px-6 py-4 text-right font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
                                                ₱{selectedOrder.totalPrice.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 text-sm font-bold text-gray-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- MODAL: CANCEL CONFIRMATION ---
    const CancelConfirmationModal = () => {
        if (!cancelOrderId) return null;
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-red-100 dark:border-red-900/50 animate-fade-in">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            <FaTimesCircle />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cancel Order?</h3>
                        <p className="text-gray-500 text-sm">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setCancelOrderId(null)} 
                            className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                        >
                            No, Keep It
                        </button>
                        <button 
                            onClick={executeCancel} 
                            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/30"
                        >
                            Yes, Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Order History</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your purchases</p>
                </div>
                <button 
                    onClick={fetchOrders} 
                    disabled={isLoading} 
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-indigo-100 rounded-xl shadow-sm hover:bg-indigo-50 hover:shadow-md transition disabled:opacity-50"
                >
                    <FaSyncAlt className={isLoading ? 'animate-spin' : ''} /> 
                    <span>Refresh List</span>
                </button>
            </header>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {orders.length === 0 && !isLoading ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                            <FaBox />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders found</h3>
                        <p className="text-gray-500 mt-2">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Total Items</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {orders.map((order) => {
                                    const totalQty = calculateTotalItems(order.items);
                                    const isCancellable = ['AWAITING PAYMENT', 'PENDING VERIFICATION'].includes(order.status);
                                    
                                    return (
                                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-indigo-600">#{order._id.slice(-6).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {totalQty} items
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                ₱{order.totalPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => openDetails(order)}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                                    >
                                                        <FaEye /> Details
                                                    </button>
                                                    
                                                    {isCancellable && (
                                                        <button 
                                                            onClick={() => setCancelOrderId(order._id)} 
                                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                                        >
                                                            <FaTimesCircle /> Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* RENDER MODALS */}
            <OrderDetailModal />
            <CancelConfirmationModal />
        </div>
    );
};

export default OrderHistory;