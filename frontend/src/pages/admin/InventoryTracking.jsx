import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { FaHistory, FaPlus, FaMinus, FaWarehouse, FaExclamationTriangle } from 'react-icons/fa';

const InventoryTracking = () => {
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState('barong');
    const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'deduct'
    const [quantity, setQuantity] = useState(0);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // --- Data Fetching ---
    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/inventory');
            setInventory(response.data.data);
        } catch (err) {
            console.error("Inventory Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // --- Actions ---
    const handleAdjustment = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        const finalQuantity = adjustmentType === 'add' ? parseInt(quantity) : -parseInt(quantity);

        if (finalQuantity === 0) {
            setMessage({ type: 'error', text: 'Quantity cannot be zero.' });
            return;
        }

        try {
            await api.patch('/admin/inventory/adjust', {
                itemName: selectedItem,
                quantity: finalQuantity,
                reason: reason || 'Manual adjustment via Dashboard'
            });
            
            setMessage({ type: 'success', text: 'Stock updated successfully.' });
            setIsModalOpen(false);
            setQuantity(0);
            setReason('');
            fetchInventory(); // Refresh data
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Adjustment failed.' });
        }
    };

    // --- Helper to find specific item data ---
    const getItemData = (name) => inventory.find(i => i.itemName === name) || { stockLevel: 0, log: [] };

    // --- UI Components ---
    const InventoryCard = ({ type, color }) => {
        const item = getItemData(type);
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                    <FaWarehouse size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">{type}</h3>
                    <div className="flex items-baseline mt-2 gap-2">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                            {item.stockLevel}
                        </span>
                        <span className="text-sm text-gray-500">units</span>
                    </div>
                    
                    {item.stockLevel < 20 && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                            <FaExclamationTriangle /> Low Stock
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time stock levels & tracking</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"
                >
                    <FaPlus className="text-xs" /> <FaMinus className="text-xs mr-1" /> Adjust Stock
                </button>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Stock Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InventoryCard type="barong" color="text-blue-600" />
                <InventoryCard type="saya" color="text-pink-600" />
                <InventoryCard type="fabrics" color="text-purple-600" />
            </div>

            {/* Logs Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <FaHistory className="text-gray-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Item</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Change</th>
                                <th className="px-6 py-3">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {inventory.flatMap(item => 
                                item.log.map(log => ({ ...log, itemName: item.itemName }))
                            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 20) // Show last 20 logs
                            .map((log, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-3 text-gray-500">
                                        {new Date(log.createdAt).toLocaleDateString()} <span className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-3 font-medium capitalize">{log.itemName}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            log.actionType === 'DEDUCTION' ? 'bg-orange-100 text-orange-700' :
                                            log.actionType === 'MANUAL_IN' ? 'bg-green-100 text-green-700' :
                                            log.actionType === 'MANUAL_OUT' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.actionType.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-3 font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 truncate max-w-xs">{log.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjustment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-slide-up">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Adjust Stock Level</h2>
                        <form onSubmit={handleAdjustment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Item</label>
                                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="input-field">
                                    <option value="barong">Barong</option>
                                    <option value="saya">Saya</option>
                                    <option value="fabrics">Fabrics</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Action</label>
                                    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                                        <button type="button" onClick={() => setAdjustmentType('add')} className={`flex-1 py-1 text-sm rounded-md transition ${adjustmentType === 'add' ? 'bg-white dark:bg-gray-600 shadow text-green-600 font-bold' : 'text-gray-500'}`}>Add</button>
                                        <button type="button" onClick={() => setAdjustmentType('deduct')} className={`flex-1 py-1 text-sm rounded-md transition ${adjustmentType === 'deduct' ? 'bg-white dark:bg-gray-600 shadow text-red-600 font-bold' : 'text-gray-500'}`}>Deduct</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Quantity</label>
                                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="input-field" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Reason</label>
                                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. New Shipment, Damaged Goods" className="input-field" required />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTracking;