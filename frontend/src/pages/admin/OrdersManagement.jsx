// OrdersManagement.jsx (ESM) - FINAL FIX
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { 
    FaCheckCircle, FaTimesCircle, FaEye, FaSyncAlt, 
    FaBoxOpen, FaExclamationTriangle, FaTimes, FaMapMarkerAlt, FaUser, FaList, FaShippingFast, FaTruckLoading, FaPrint
} from 'react-icons/fa';

const STATUS_OPTIONS = [
    'AWAITING PAYMENT', 'PENDING VERIFICATION', 'PROCESSING', 
    'SHIPPED', 'DELIVERED', 'CANCELLED'
];

// --- HELPER COMPONENT: Status Badge ---
const StatusBadge = ({ status }) => {
    if (!status) return <span className="text-gray-400 text-xs">Unknown</span>;
    const styles = {
        'AWAITING PAYMENT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'PENDING VERIFICATION': 'bg-orange-100 text-orange-800 border-orange-200',
        'PROCESSING': 'bg-blue-100 text-blue-800 border-blue-200',
        'SHIPPED': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'DELIVERED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'CANCELLED': 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
        <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full border ${styles[status] || 'bg-gray-100'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const OrdersManagement = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStatusFilter, setCurrentStatusFilter] = useState('');
    
    // --- MODAL STATES ---
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [proofImageUrl, setProofImageUrl] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, orderId: null, newStatus: '', title: '', description: '' 
    });

    const fetchOrders = async () => {
        setIsLoading(true);
        setError('');
        try {
            const statusQuery = currentStatusFilter ? `?status=${currentStatusFilter}` : '';
            const response = await api.get(`/admin/orders${statusQuery}`);
            setOrders(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError('Failed to fetch orders.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentStatusFilter]);

    // --- ACTIONS ---
    const initiateStatusUpdate = (orderId, newStatus) => {
        if (newStatus === 'SHIPPED') {
            alert('Cannot ship directly from this button. Use Details Modal for tracking number input.');
            return;
        }

        let title = "Update Order Status?";
        let description = `Change status to ${newStatus}?`;
        if (newStatus === 'PROCESSING') {
            title = "Accept & Deduct Stock";
            description = "This will verify payment and DEDUCT items from inventory.";
        } else if (newStatus === 'CANCELLED') {
            title = "Cancel & Restore Stock";
            description = "This will cancel the order and RESTORE items to inventory.";
        } else if (newStatus === 'DELIVERED') {
             title = "Mark as Delivered";
            description = "Confirm customer receipt.";
        }
        setConfirmModal({ isOpen: true, orderId, newStatus, title, description });
    };

    const executeStatusUpdate = async () => {
        const { orderId, newStatus } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false });
        setIsLoading(true);
        try {
            await api.patch(`/admin/orders/${orderId}`, { status: newStatus });
            setSuccessMessage(`Order updated to ${newStatus} successfully!`);
            fetchOrders();
            setIsDetailModalOpen(false); 
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Failed to update order.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // NEW FUNCTION: EXECUTES SHIPPED STATUS (with tracking)
    const executeShipment = async (orderId, trackingNumber) => {
        if (!trackingNumber) {
            alert('Tracking number is required.');
            return;
        }

        setIsLoading(true);
        try {
            await api.patch(`/admin/orders/${orderId}`, { 
                status: 'SHIPPED', 
                trackingNumber: trackingNumber 
            });
            setSuccessMessage(`Order marked SHIPPED. Tracking ID saved.`);
            setIsDetailModalOpen(false);
            fetchOrders();
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Shipment update failed.');
        } finally {
            setIsLoading(false);
        }
    };


    const openProof = (url, e) => {
        e?.stopPropagation(); 
        setProofImageUrl(url);
        setIsProofModalOpen(true);
    };

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const calculateTotalItems = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((acc, item) => acc + (item.quantity || 0), 0);
    };

    // --- MODAL: ORDER DETAILS (ULTRA SAFE) ---
    const OrderDetailModal = () => {
        if (!isDetailModalOpen || !selectedOrder) return null;

        // NEW: Local state for tracking number input
        const [trackingInput, setTrackingInput] = useState(selectedOrder.trackingNumber || '');
        const isReadyToShip = selectedOrder.status === 'PROCESSING';
        const isShipped = selectedOrder.status === 'SHIPPED';

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Order #{selectedOrder._id?.slice(-6).toUpperCase() || 'UNKNOWN'}
                                <StatusBadge status={selectedOrder.status} />
                            </h3>
                            <p className="text-sm text-gray-500">
                                {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'Date N/A'}
                            </p>
                        </div>
                        <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4 text-sm dark:text-gray-300">
                                <h4 className="font-bold uppercase text-gray-500 flex items-center gap-2"><FaUser /> Customer</h4>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                    <p><span className="font-semibold">Name:</span> {selectedOrder.resellerId?.name || 'Unknown'}</p>
                                    <p><span className="font-semibold">Email:</span> {selectedOrder.resellerId?.email || 'N/A'}</p>
                                </div>

                                <h4 className="font-bold uppercase text-gray-500 flex items-center gap-2 mt-4"><FaMapMarkerAlt /> Shipping</h4>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                    <p className="font-semibold">{selectedOrder.shippingAddress?.contactInfo || 'N/A'}</p>
                                    <p>{selectedOrder.shippingAddress?.street || 'N/A'}</p>
                                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}</p>
                                </div>
                            </div>

                            {/* Payment Proof & Tracking Form */}
                            <div>
                                <h4 className="font-bold uppercase text-gray-500 mb-2 flex items-center gap-2"><FaList /> Payment Proof</h4>
                                <div className="h-48 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group">
                                    {selectedOrder.proofOfPaymentUrl ? (
                                        <>
                                            <img src={selectedOrder.proofOfPaymentUrl} className="w-full h-full object-cover opacity-90" alt="Proof" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={(e) => openProof(selectedOrder.proofOfPaymentUrl, e)} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg">View Full Size</button>
                                            </div>
                                        </>
                                    ) : <p className="text-gray-400 text-sm">No proof uploaded</p>}
                                </div>
                                
                                {/* Tracking Display/Form */}
                                <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                    <h5 className="text-xs font-bold uppercase mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                        <FaShippingFast /> Tracking Number
                                    </h5>
                                    {isReadyToShip || isShipped ? (
                                        // TRACKING INPUT FORM (Only appears if ready to ship or if shipped)
                                        <form onSubmit={(e) => { e.preventDefault(); executeShipment(selectedOrder._id, trackingInput); }}>
                                            <input 
                                                type="text" 
                                                value={trackingInput} 
                                                onChange={e => setTrackingInput(e.target.value)}
                                                className="input-field w-full p-2 border rounded"
                                                placeholder="Enter Tracking Number"
                                                disabled={isShipped} // Disable if already shipped
                                                required
                                            />
                                            {isReadyToShip && (
                                                <button type="submit" className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-gray-400">
                                                    Confirm Ship
                                                </button>
                                            )}
                                            {isShipped && <p className="text-sm font-mono text-indigo-700 mt-2">Shipped on: {selectedOrder.shippingDate ? new Date(selectedOrder.shippingDate).toLocaleDateString() : 'Date N/A'}</p>}
                                        </form>
                                    ) : (
                                        // Default Display
                                        <p className="font-mono text-sm break-all text-gray-500">
                                            Not ready for shipment input.
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Items Table */}
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FaBoxOpen /> Order Items
                        </h4>
                        <div className="border rounded-xl dark:border-gray-700 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {(selectedOrder.items || []).map((item, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2 dark:text-white">
                                                {item.name || 'Unknown Item'} <span className="block text-xs text-gray-500">{item.SKU || ''}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right dark:text-white">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right dark:text-gray-300">₱{(item.priceAtTimeOfOrder || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-bold dark:text-white">₱{((item.priceAtTimeOfOrder || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 dark:bg-gray-700/30">
                                        <td colSpan="3" className="px-4 py-2 text-right text-gray-500">Shipping Fee</td>
                                        <td className="px-4 py-2 text-right font-medium dark:text-white">₱{(selectedOrder.shippingFee || 0).toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-bold text-lg">
                                        <td colSpan="3" className="px-4 py-3 text-right text-indigo-900 dark:text-indigo-200">Grand Total</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">₱{(selectedOrder.totalPrice || 0).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* FOOTER ACTIONS */}
                    <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
                        {/* Print Invoice Button - LEFT ALIGNED */}
                        <button 
                            onClick={() => window.open(`/admin/invoice/${selectedOrder._id}`, '_blank')}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-bold text-sm shadow-sm"
                        >
                            <FaPrint /> Print Invoice
                        </button>

                        <div className="flex gap-3">
                            <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700">Close</button>
                            
                            {selectedOrder.status === 'PENDING VERIFICATION' && (
                                <button onClick={() => { setIsDetailModalOpen(false); initiateStatusUpdate(selectedOrder._id, 'PROCESSING'); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold">
                                    Verify & Process
                                </button>
                            )}
                            
                            {/* Finalization Button */}
                            {selectedOrder.status === 'SHIPPED' && (
                                <button onClick={() => initiateStatusUpdate(selectedOrder._id, 'DELIVERED')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold">
                                    Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ConfirmationDialog = () => {
        if (!confirmModal.isOpen) return null;
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{confirmModal.description}</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                        <button onClick={executeStatusUpdate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Confirm</button>
                    </div>
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
                <div className="flex gap-2">
                    <select value={currentStatusFilter} onChange={(e) => setCurrentStatusFilter(e.target.value)} className="input-field py-1 border rounded px-2">
                        <option value="">All Statuses</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={fetchOrders} className="p-2 text-indigo-600 bg-white rounded shadow hover:bg-gray-50"><FaSyncAlt /></button>
                </div>
            </header>
            
            {successMessage && <div className="p-4 bg-green-100 text-green-700 rounded-lg shadow-sm border border-green-200">{successMessage}</div>}
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Summary</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm font-medium text-indigo-600">#{order._id.slice(-6).toUpperCase()}</td>
                                <td className="px-6 py-4 text-sm dark:text-gray-300">
                                    <div className="font-medium">{order.resellerId?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{order.resellerId?.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm dark:text-gray-300">{calculateTotalItems(order.items)} Items</td>
                                <td className="px-6 py-4 text-sm font-bold dark:text-white">₱{(order.totalPrice || 0).toFixed(2)}</td>
                                <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => openDetails(order)} className="p-2 text-indigo-600 bg-indigo-50 rounded text-xs font-bold flex items-center gap-1 hover:bg-indigo-100"><FaList/> Details</button>
                                    
                                    {order.status === 'PENDING VERIFICATION' && (
                                        <button onClick={() => initiateStatusUpdate(order._id, 'PROCESSING')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"><FaCheckCircle size={16} /></button>
                                    )}
                                    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                        <button onClick={() => initiateStatusUpdate(order._id, 'CANCELLED')} className="p-2 text-red-400 hover:bg-red-50 rounded"><FaTimesCircle size={16} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && !isLoading && <div className="p-10 text-center text-gray-500">No orders found.</div>}
            </div>

            <ConfirmationDialog />
            <OrderDetailModal />
            
            {isProofModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90" onClick={() => setIsProofModalOpen(false)}>
                    <img src={proofImageUrl} className="max-h-[90vh] rounded" alt="Full Proof" />
                </div>
            )}
        </div>
    );
};

export default OrdersManagement;