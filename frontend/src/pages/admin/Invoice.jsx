import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api.js';
import { FaPrint } from 'react-icons/fa';

const Invoice = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [reseller, setReseller] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/admin/orders?_id=${id}`); // Fetch specific order
                // Note: Admin list returns array, we grab the first one
                const orderData = res.data.data.find(o => o._id === id);
                
                if (orderData) {
                    setOrder(orderData);
                    
                    // Robust User Fetch (Fixing the "Unknown" issue)
                    if (orderData.resellerId && orderData.resellerId.name) {
                        setReseller(orderData.resellerId);
                    } else {
                        const userId = orderData.resellerId?._id || orderData.resellerId;
                        const userRes = await api.get(`/admin/users/${userId}`);
                        setReseller(userRes.data.data);
                    }
                }
            } catch (err) {
                console.error("Invoice Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) return <div className="p-10 text-center">Loading Invoice...</div>;
    if (!order) return <div className="p-10 text-center text-red-500">Order not found.</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans print:p-0 print:bg-white">
            
            {/* Print Button (Hidden when printing) */}
            <div className="max-w-3xl mx-auto mb-6 text-right print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 ml-auto"
                >
                    <FaPrint /> Print Invoice
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow-xl print:shadow-none print:w-full">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Invoice</h1>
                        <p className="text-gray-500 mt-1">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-indigo-700">Case Orencia</h2>
                        <p className="text-sm text-gray-500">Premium Native Wear Supplier</p>
                        <p className="text-sm text-gray-500">Lumban, Laguna, Philippines</p>
                        <p className="text-sm text-gray-500">support@caseorencia.com</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="flex justify-between mb-10">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Billed To</h3>
                        <p className="font-bold text-gray-900">{reseller?.name || 'Valued Reseller'}</p>
                        <p className="text-gray-600 text-sm">{reseller?.email}</p>
                        <p className="text-gray-600 text-sm mt-2">{order.shippingAddress.contactInfo}</p>
                        <p className="text-gray-600 text-sm">{order.shippingAddress.street}</p>
                        <p className="text-gray-600 text-sm">
                            {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                        </p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Order Info</h3>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-600">Date:</span> <span className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                            <p><span className="text-gray-600">Status:</span> <span className="font-bold uppercase">{order.status.replace('_', ' ')}</span></p>
                            <p><span className="text-gray-600">Payment:</span> <span className="font-bold">{order.paymentMethod.replace('_', ' ')}</span></p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 text-sm font-bold text-gray-600 uppercase">Description</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase">Price</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase">Qty</th>
                            <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-4">
                                    <p className="font-bold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">SKU: {item.SKU}</p>
                                </td>
                                <td className="py-4 text-right text-gray-700">₱{item.priceAtTimeOfOrder.toFixed(2)}</td>
                                <td className="py-4 text-right text-gray-700">{item.quantity}</td>
                                <td className="py-4 text-right font-bold text-gray-900">
                                    ₱{(item.priceAtTimeOfOrder * item.quantity).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₱{(order.totalPrice - order.shippingFee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span>₱{order.shippingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-gray-800 pt-3 text-xl font-bold text-gray-900">
                            <span>Total</span>
                            <span>₱{order.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
                    <p>Thank you for your business!</p>
                    <p className="mt-1 text-xs">For questions concerning this invoice, please contact support.</p>
                </div>
            </div>
        </div>
    );
};

export default Invoice;