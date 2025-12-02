import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api'; // Adjust path to your api instance
import { FaPrint, FaDownload } from 'react-icons/fa';

const InvoicePrint = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Ensure this endpoint returns the full order with populated items/user
                const response = await api.get(`/admin/orders/${id}`);
                setOrder(response.data.data || response.data);
            } catch (err) {
                setError('Could not load invoice data.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading Invoice...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!order) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white flex justify-center">
            {/* INVOICE CONTAINER (A4 Ratio) */}
            <div className="bg-white shadow-lg w-full max-w-[210mm] p-10 print:shadow-none print:w-full">
                
                {/* --- HEADER --- */}
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">INVOICE</h1>
                        <p className="text-gray-500 mt-1">#{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-indigo-600">Photon PH</h2> {/* Replace with your Brand */}
                        <p className="text-sm text-gray-500">123 Tech Avenue, Manila</p>
                        <p className="text-sm text-gray-500">support@photon.ph</p>
                    </div>
                </div>

                {/* --- INFO GRID --- */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
                        <p className="font-bold text-gray-800">{order.resellerId?.name}</p>
                        <p className="text-sm text-gray-600">{order.resellerId?.email}</p>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                            {order.shippingAddress?.street} <br/>
                            {order.shippingAddress?.city}, {order.shippingAddress?.zipCode}
                        </p>
                    </div>
                    <div className="text-right space-y-2">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Date</h3>
                            <p className="font-medium text-gray-800">
                                {new Date().toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Date</h3>
                            <p className="font-medium text-gray-800">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</h3>
                            <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-800">
                                <th className="py-3 text-sm font-bold text-gray-600 uppercase">Description</th>
                                <th className="py-3 text-sm font-bold text-gray-600 uppercase text-right">Qty</th>
                                <th className="py-3 text-sm font-bold text-gray-600 uppercase text-right">Unit Price</th>
                                <th className="py-3 text-sm font-bold text-gray-600 uppercase text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {order.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="py-4">
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.SKU || 'No SKU'}</p>
                                    </td>
                                    <td className="py-4 text-right">{item.quantity}</td>
                                    <td className="py-4 text-right">₱{item.priceAtTimeOfOrder.toLocaleString()}</td>
                                    <td className="py-4 text-right font-medium">
                                        ₱{(item.quantity * item.priceAtTimeOfOrder).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- TOTALS --- */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₱{(order.totalPrice - (order.shippingFee || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span>₱{(order.shippingFee || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-800 pt-3 border-t-2 border-gray-800 text-lg font-bold">
                            <span>Total</span>
                            <span>₱{order.totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="border-t pt-8 text-center text-gray-500 text-sm">
                    <p className="mb-2 font-bold">Thank you for your business!</p>
                    <p>If you have any questions about this invoice, please contact support@photon.ph</p>
                </div>

                {/* --- PRINT ACTIONS (Hidden when printing) --- */}
                <div className="mt-8 flex justify-center gap-4 print:hidden">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 transition"
                    >
                        <FaPrint /> Print Invoice
                    </button>
                    <button 
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded shadow hover:bg-gray-300 transition"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InvoicePrint;