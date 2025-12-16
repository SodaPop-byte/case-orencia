// CheckoutPage.jsx (ESM) - FIXED: FORCE TOKEN INJECTION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { FaCheckCircle, FaUpload, FaTrashAlt, FaArrowLeft } from 'react-icons/fa';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems, totalPrice, totalItems, clearCart, removeFromCart } = useCart();
    
    const [settings, setSettings] = useState({ shippingFee: 0, bankDetails: '', qrCodeImage: '' });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [orderSubmitted, setOrderSubmitted] = useState(null);
    
    // SPLIT CONTACT FIELDS
    const [addressData, setAddressData] = useState({ 
        street: '', city: '', zipCode: '', 
        contactName: '', contactNumber: '' 
    });
    const [proofFile, setProofFile] = useState(null);
    const [proofUploadStatus, setProofUploadStatus] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/content/landing');
                setSettings(res.data.data || {});
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (totalItems === 0 && !orderSubmitted && !isLoadingSettings) {
            navigate('/reseller/catalog');
        }
    }, [totalItems, orderSubmitted, isLoadingSettings, navigate]);

    // Safety check for totalPrice and shippingFee
    const safeShippingFee = settings.shippingFee || 0;
    const grandTotal = totalPrice + safeShippingFee;

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressData(prev => ({ ...prev, [name]: value }));
    };

    const handleOrderSubmission = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // 1. VALIDATION: Phone Number
        const phoneRegex = /^[0-9]{10,12}$/;
        if (!phoneRegex.test(addressData.contactNumber.replace(/\D/g, ''))) {
            setError('Please enter a valid contact number (e.g., 09171234567).');
            setIsLoading(false);
            return;
        }

        const itemsData = cartItems.map(item => ({
            productId: item.productId || item._id, // Handle both ID formats
            quantity: item.quantity,
        }));
        
        const combinedContact = `${addressData.contactName} (${addressData.contactNumber})`;

        // 🛑 CRITICAL FIX: MANUALLY GRAB TOKEN 🛑
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            setError("You appear to be logged out. Please login again.");
            setIsLoading(false);
            return;
        }

        try {
            // 🛑 FORCE ATTACH TOKEN TO HEADERS 🛑
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // <--- THIS FIXES THE ERROR
                }
            };
            
            const response = await api.post('/reseller/orders', {
                items: itemsData,
                shippingAddress: { 
                    street: addressData.street,
                    city: addressData.city,
                    zipCode: addressData.zipCode,
                    contactInfo: combinedContact,
                },
                shippingFee: safeShippingFee,
            }, config);

            setSuccessMessage('Order placed! Please upload proof of payment.');
            setOrderSubmitted(response.data.data);
            clearCart(); 
        } catch (err) {
            console.error("Order Error:", err.response || err);
            const msg = err.response?.data?.message || 'Order failed. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProofUpload = async (e) => {
        e.preventDefault();
        setProofUploadStatus('Uploading...');
        
        const formData = new FormData();
        formData.append('proof', proofFile); 
        
        // 🛑 CRITICAL FIX: MANUALLY GRAB TOKEN FOR UPLOAD TOO 🛑
        const token = localStorage.getItem('accessToken');

        try {
            await api.patch(`/reseller/orders/${orderSubmitted._id}/upload-proof`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` // <--- FORCE TOKEN HERE TOO
                },
            });
            
            setProofUploadStatus('Upload Complete!');
            setSuccessMessage('Proof uploaded. Check your history for updates.');
            setTimeout(() => navigate('/reseller/orders'), 3000); 
        } catch (err) {
            setProofUploadStatus('Upload Failed.');
            console.error(err);
            setError("Failed to upload proof. Please try again from Order History.");
        }
    };

    if (isLoadingSettings) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Checkout...</div>;
    if (totalItems === 0 && !orderSubmitted) return null;

    if (orderSubmitted) {
        return (
            <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl space-y-6 mt-10 border border-gray-100 dark:border-gray-700">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                        <FaCheckCircle />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Placed!</h1>
                    <p className="text-gray-500 dark:text-gray-400">Order #{orderSubmitted._id.slice(-6).toUpperCase()} confirmed.</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2">
                        Step 2: Pay & Upload Proof
                    </h3>
                    
                    {settings.qrCodeImage && (
                        <div className="mb-6 text-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 inline-block w-full">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Scan to Pay</p>
                            <img src={settings.qrCodeImage} alt="Payment QR" className="mx-auto w-48 h-48 object-contain rounded-lg" />
                        </div>
                    )}
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 text-sm font-mono whitespace-pre-wrap dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                        {settings.bankDetails || "No bank details configured."}
                    </div>

                    <form onSubmit={handleProofUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Screenshot / Receipt</label>
                            <input type="file" onChange={(e) => setProofFile(e.target.files[0])} accept="image/*" className="w-full text-sm text-gray-500" required />
                        </div>
                        <button type="submit" className="btn btn-primary w-full py-3" disabled={!proofFile || proofUploadStatus === 'Upload Complete!'}>
                            <FaUpload className="mr-2" /> {proofUploadStatus || 'Submit Payment Proof'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 grid lg:grid-cols-12 gap-8">
            {/* LEFT: Shipping Form */}
            <div className="lg:col-span-7 space-y-6">
                <button onClick={() => navigate('/reseller/catalog')} className="flex items-center text-gray-500 hover:text-indigo-600 transition mb-2">
                    <FaArrowLeft className="mr-2" /> Continue Shopping
                </button>

                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">Shipping Details</h2>
                    <form id="checkout-form" onSubmit={handleOrderSubmission} className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                                <input name="contactName" placeholder="Juan Dela Cruz" onChange={handleAddressChange} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                <input name="contactNumber" type="tel" placeholder="09171234567" onChange={handleAddressChange} className="input-field" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                            <input name="street" placeholder="123 Main St, Barangay..." onChange={handleAddressChange} className="input-field" required />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / Province</label>
                                <input name="city" placeholder="Manila" onChange={handleAddressChange} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                                <input name="zipCode" placeholder="1000" onChange={handleAddressChange} className="input-field" required />
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-24">
                    <h2 className="text-xl font-bold mb-6 dark:text-white">Order Summary</h2>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {cartItems.map(item => (
                            <div key={item.productId || item._id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₱{item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">₱{(item.price * item.quantity).toFixed(2)}</span>
                                    <button 
                                        onClick={() => removeFromCart(item.productId || item._id)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                        title="Remove item"
                                    >
                                        <FaTrashAlt size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₱{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Shipping Fee</span>
                            <span>₱{safeShippingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-extrabold text-gray-900 dark:text-white pt-2">
                            <span>Total</span>
                            <span className="text-indigo-600 dark:text-indigo-400">₱{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button type="submit" form="checkout-form" disabled={isLoading} className="btn btn-primary w-full mt-8 py-3 text-lg shadow-xl shadow-indigo-200 dark:shadow-none">
                        {isLoading ? 'Processing Order...' : 'Confirm & Pay'}
                    </button>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;