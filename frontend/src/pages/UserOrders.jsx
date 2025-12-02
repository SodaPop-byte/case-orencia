import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
    FaBox, FaTruck, FaCheckCircle, FaClock, FaChevronRight, FaTimes, 
    FaShoppingBag, FaUpload, FaTrashAlt, FaImage
} from 'react-icons/fa';

const TABS = [
    { label: 'All', value: '' },
    { label: 'To Pay', value: 'AWAITING_PAYMENT' },
    { label: 'To Ship', value: 'PROCESSING' }, // Matches logic below
    { label: 'To Receive', value: 'SHIPPED' },
    { label: 'Completed', value: 'DELIVERED' },
];

const UserOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    // --- UPLOAD STATE ---
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [orderToUpload, setOrderToUpload] = useState(null);
    const [uploading, setUploading] = useState(false);

    // --- FETCH ORDERS ---
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/my-orders'); 
            setOrders(res.data.data || []);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // --- ACTIONS ---

    // 1. Mark Received
    const markReceived = async (orderId) => {
        if(!window.confirm("Confirm you have received this order?")) return;
        try {
            await api.patch(`/orders/${orderId}/receive`);
            fetchOrders(); 
            setSelectedOrder(null);
        } catch (err) {
            alert('Action failed. Please try again.');
        }
    };

    // 2. Cancel Order
    const cancelOrder = async (orderId) => {
        if(!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            await api.patch(`/orders/${orderId}/cancel`);
            fetchOrders();
            setSelectedOrder(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order.');
        }
    };

    // 3. Open Upload Modal
    const initiateUpload = (order, e) => {
        e.stopPropagation();
        setOrderToUpload(order);
        setUploadFile(null);
        setIsUploadModalOpen(true);
    };

    // 4. Submit Payment Proof
    const submitPaymentProof = async (e) => {
        e.preventDefault();
        if (!uploadFile || !orderToUpload) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('proofImage', uploadFile); // Key must match backend multer config

        try {
            // NOTE: Ensure your API handles 'Content-Type': 'multipart/form-data' automatically
            // or api.js is configured to let browser set it for FormData
            await api.put(`/orders/${orderToUpload._id}/pay`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsUploadModalOpen(false);
            fetchOrders();
            alert("Payment proof uploaded! Please wait for verification.");
        } catch (err) {
            console.error(err);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // --- HELPER: STATUS BADGE ---
    const getStatusColor = (status) => {
        const map = {
            'AWAITING_PAYMENT': 'bg-yellow-100 text-yellow-700',
            'PENDING_VERIFICATION': 'bg-orange-100 text-orange-700',
            'PROCESSING': 'bg-blue-100 text-blue-700',
            'SHIPPED': 'bg-indigo-100 text-indigo-700',
            'DELIVERED': 'bg-green-100 text-green-700',
            'CANCELLED': 'bg-gray-100 text-gray-500',
        };
        return map[status] || 'bg-gray-100';
    };

    // --- FILTER LOGIC ---
    const getFilteredOrders = () => {
        if (!activeTab) return orders;
        if (activeTab === 'PROCESSING') {
            return orders.filter(o => o.status === 'PENDING_VERIFICATION' || o.status === 'PROCESSING');
        }
        return orders.filter(o => o.status === activeTab);
    };

    const filteredOrders = getFilteredOrders();

    return (
        <div className="max-w-4xl mx-auto p-4 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Orders</h1>

            {/* TABS */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(tab.value)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            activeTab === tab.value 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* LIST */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading your orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    <FaShoppingBag className="text-gray-300 text-6xl mb-4" />
                    <p className="text-gray-500 font-medium">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div 
                            key={order._id} 
                            onClick={() => setSelectedOrder(order)}
                            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-mono">Order #{order._id.slice(-6).toUpperCase()}</p>
                                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    <FaBox />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white line-clamp-1">
                                        {order.items[0]?.name || 'Unknown Item'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {order.items.length > 1 
                                            ? `+ ${order.items.length - 1} other items` 
                                            : `x${order.items[0]?.quantity}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t pt-4 dark:border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500">Total Amount</p>
                                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                        ₱{order.totalPrice.toFixed(2)}
                                    </p>
                                </div>
                                
                                {/* ACTION BUTTONS ON CARD */}
                                <div className="flex gap-2">
                                    {order.status === 'AWAITING_PAYMENT' && (
                                        <button 
                                            onClick={(e) => initiateUpload(order, e)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2"
                                        >
                                            <FaUpload /> Pay Now
                                        </button>
                                    )}
                                    <button className="text-sm font-bold text-gray-500 group-hover:text-indigo-600 flex items-center gap-1 transition">
                                        Details <FaChevronRight size={12}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- UPLOAD PAYMENT MODAL --- */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setIsUploadModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-2 dark:text-white">Upload Proof of Payment</h3>
                        <p className="text-sm text-gray-500 mb-4">Please upload a clear screenshot of your bank transfer or GCash receipt.</p>
                        
                        <form onSubmit={submitPaymentProof}>
                            <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition mb-4">
                                {uploadFile ? (
                                    <p className="text-indigo-600 font-bold text-sm">{uploadFile.name}</p>
                                ) : (
                                    <>
                                        <FaImage className="text-gray-400 text-2xl mb-2" />
                                        <span className="text-xs text-gray-500">Click to Select Image</span>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={e => setUploadFile(e.target.files[0])}
                                    required
                                />
                            </label>

                            <button 
                                type="submit" 
                                disabled={uploading || !uploadFile}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:bg-gray-400"
                            >
                                {uploading ? 'Uploading...' : 'Submit Proof'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DETAIL MODAL --- */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-white">Order Details</h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full"><FaTimes /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            
                            {/* Tracking */}
                            {selectedOrder.trackingNumber && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                                    <FaTruck className="mt-1 text-indigo-600" />
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 uppercase">Tracking Number</p>
                                        <p className="font-mono text-lg font-bold text-gray-800 select-all">{selectedOrder.trackingNumber}</p>
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-bold text-gray-900 dark:text-white mb-1">Shipping Address</p>
                                <p>{selectedOrder.shippingAddress?.street}</p>
                                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}</p>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white mb-3">Items</p>
                                <div className="space-y-3">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <div className="flex gap-3">
                                                <span className="font-bold text-gray-500">x{item.quantity}</span>
                                                <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                            </div>
                                            <span className="font-medium">₱{(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold text-lg dark:text-white">
                                    <span>Total</span>
                                    <span className="text-indigo-600">₱{selectedOrder.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* DETAIL FOOTER ACTIONS */}
                        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2">
                             {/* Cancel Button */}
                            {(selectedOrder.status === 'AWAITING_PAYMENT' || selectedOrder.status === 'PENDING_VERIFICATION') && (
                                <button 
                                    onClick={() => cancelOrder(selectedOrder._id)}
                                    className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl flex justify-center items-center gap-2"
                                >
                                    <FaTrashAlt /> Cancel Order
                                </button>
                            )}

                             {/* Pay Button */}
                            {selectedOrder.status === 'AWAITING_PAYMENT' && (
                                <button 
                                    onClick={(e) => { setSelectedOrder(null); initiateUpload(selectedOrder, e); }}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex justify-center items-center gap-2"
                                >
                                    <FaUpload /> Upload Payment
                                </button>
                            )}

                            {/* Receive Button */}
                            {selectedOrder.status === 'SHIPPED' && (
                                <button 
                                    onClick={() => markReceived(selectedOrder._id)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2"
                                >
                                    <FaCheckCircle /> Order Received
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserOrders;