// SiteSettings.jsx (ESM) - UPDATED
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { FaSave, FaImage, FaCreditCard, FaTruck } from 'react-icons/fa';

const SiteSettings = () => {
    const [formData, setFormData] = useState({ 
        title: '', subtitle: '', shippingFee: 150, bankDetails: '' 
    });
    const [heroPreview, setHeroPreview] = useState('');
    const [qrPreview, setQrPreview] = useState('');
    const [heroFile, setHeroFile] = useState(null);
    const [qrFile, setQrFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/content/landing');
                const data = res.data.data;
                setFormData({ 
                    title: data.title, 
                    subtitle: data.subtitle,
                    shippingFee: data.shippingFee || 150,
                    bankDetails: data.bankDetails || ''
                });
                setHeroPreview(data.heroImage);
                setQrPreview(data.qrCodeImage);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e, type) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const data = new FormData();
        // Append text fields
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('shippingFee', formData.shippingFee);
        data.append('bankDetails', formData.bankDetails);

        // Determine which image to upload (if any)
        if (type === 'hero' && heroFile) {
            data.append('hero', heroFile); // The middleware looks for a file
            data.append('imageType', 'hero');
        } else if (type === 'qr' && qrFile) {
            data.append('hero', qrFile); // Reusing the 'hero' field name for the middleware
            data.append('imageType', 'qr');
        } else {
            // Just text update
            data.append('imageType', 'none');
        }

        try {
            await api.put('/content/landing', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessage('Settings updated successfully!');
        } catch (err) {
            setMessage('Failed to update settings.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Site Configuration</h1>
            
            {message && <div className="p-4 bg-green-100 text-green-700 rounded-xl">{message}</div>}

            {/* SECTION 1: Payment & Shipping */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                    <FaCreditCard /> Payment & Shipping
                </h2>
                <form onSubmit={(e) => handleSubmit(e, 'qr')} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standard Shipping Fee (₱)</label>
                            <input 
                                type="number" 
                                value={formData.shippingFee} 
                                onChange={e => setFormData({...formData, shippingFee: e.target.value})}
                                className="input-field" required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment QR Code</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 border rounded-lg overflow-hidden">
                                    {qrPreview && <img src={qrPreview} className="w-full h-full object-cover" />}
                                </div>
                                <input type="file" onChange={e => {
                                    setQrFile(e.target.files[0]);
                                    setQrPreview(URL.createObjectURL(e.target.files[0]));
                                }} className="text-sm text-gray-500" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Details / Instructions</label>
                        <textarea 
                            value={formData.bankDetails} 
                            onChange={e => setFormData({...formData, bankDetails: e.target.value})}
                            className="input-field" rows="3" placeholder="e.g. BDO Account: 123-456..." required 
                        ></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary">
                        {isLoading ? 'Saving...' : 'Save Payment Settings'}
                    </button>
                </form>
            </div>

            {/* SECTION 2: Landing Page Visuals */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                    <FaImage /> Landing Page Visuals
                </h2>
                <form onSubmit={(e) => handleSubmit(e, 'hero')} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hero Banner Image</label>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group">
                            {heroPreview && <img src={heroPreview} className="w-full h-full object-cover" />}
                            <input type="file" onChange={e => {
                                setHeroFile(e.target.files[0]);
                                setHeroPreview(URL.createObjectURL(e.target.files[0]));
                            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <div className="grid gap-4">
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="Main Title" />
                        <textarea value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="input-field" rows="2" placeholder="Subtitle"></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary">
                        {isLoading ? 'Saving...' : 'Save Visuals'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SiteSettings;