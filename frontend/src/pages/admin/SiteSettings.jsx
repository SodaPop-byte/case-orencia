// SiteSettings.jsx (ESM) - FINAL COMPLETE VERSION (WITH ZOD IMPORT)
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { z } from 'zod'; // <--- CRITICAL FIX: Zod must be imported
import { FaSave, FaImage, FaCreditCard, FaTruck, FaUserPlus, FaUserShield, FaHeading, FaTimes } from 'react-icons/fa'; 

// Zod Schema for client-side validation of new users
const UserSchema = z.object({
    name: z.string().min(3, "Name required."),
    email: z.string().email("Invalid email format."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    role: z.enum(['admin', 'reseller', 'staff']),
});

const SiteSettings = () => {
    // --- Settings States (Existing CMS) ---
    const initialSettingsState = { title: '', subtitle: '', shippingFee: 150, bankDetails: '' };
    const [formData, setFormData] = useState(initialSettingsState);
    const [heroPreview, setHeroPreview] = useState('');
    const [qrPreview, setQrPreview] = useState('');
    const [heroFile, setHeroFile] = useState(null);
    const [qrFile, setQrFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // --- User Creation States (New) ---
    const initialUserState = { name: '', email: '', password: '', role: 'reseller' };
    const [userFormData, setUserFormData] = useState(initialUserState);
    const [userFormError, setUserFormError] = useState('');
    const [userFormSuccess, setUserFormSuccess] = useState('');


    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/public/landing');
                const data = res.data.data;
                setFormData({ 
                    title: data.title || '', 
                    subtitle: data.subtitle || '',
                    shippingFee: data.shippingFee || 150,
                    bankDetails: data.bankDetails || ''
                });
                setHeroPreview(data.heroImage);
                setQrPreview(data.qrCodeImage);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    // --- CMS Handlers ---
    const handleFileChange = (setter, fileKey) => (e) => {
        const selected = e.target.files[0];
        setter(selected);
        if (fileKey === 'hero') setHeroPreview(URL.createObjectURL(selected));
        if (fileKey === 'qr') setQrPreview(URL.createObjectURL(selected));
    };

    const handleSubmit = async (e, type) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('shippingFee', formData.shippingFee);
        data.append('bankDetails', formData.bankDetails);
        data.append('imageType', type);

        if (type === 'hero' && heroFile) {
            data.append('hero', heroFile);
        } else if (type === 'qr' && qrFile) {
            data.append('hero', qrFile); 
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
    
    // NEW: User Form Handlers
    const handleUserChange = (e) => {
        const { name, value } = e.target;
        setUserFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUserCreate = async (e) => {
        e.preventDefault();
        setUserFormError('');
        setUserFormSuccess('');
        
        try {
            // Client-side Zod validation
            const validatedData = UserSchema.parse(userFormData);
            
            // API call to the new protected endpoint
            const res = await api.post('/admin/users', validatedData);

            setUserFormSuccess(`Successfully created user: ${validatedData.name} (${validatedData.role})`);
            setUserFormData(initialUserState); // Reset form
        } catch (error) {
            if (error instanceof z.ZodError) {
                setUserFormError(error.errors.map(err => `• ${err.path[0]}: ${err.message}`).join(' / '));
            } else if (error.response?.data?.message) {
                setUserFormError(error.response.data.message);
            } else {
                setUserFormError('User creation failed.');
            }
        }
    };


    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Site Configuration</h1>
            
            {/* ALERT BOX for Settings */}
            {message && <div className="p-3 mb-4 rounded-xl bg-emerald-100 border-emerald-400 text-emerald-700">{message}</div>}


            {/* SECTION 1: Payment & Shipping */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                    <FaCreditCard /> Payment & Shipping
                </h2>
                <form onSubmit={(e) => handleSubmit(e, 'qr')} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standard Shipping Fee (₱)</label>
                            <input type="number" value={formData.shippingFee} onChange={e => setFormData({...formData, shippingFee: e.target.value})} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment QR Code</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 border rounded-lg overflow-hidden shrink-0">
                                    {qrPreview && <img src={qrPreview} className="w-full h-full object-cover" />}
                                </div>
                                <input type="file" onChange={handleFileChange(setQrFile, 'qr')} className="text-sm text-gray-500" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Details / Instructions</label>
                        <textarea value={formData.bankDetails} onChange={e => setFormData({...formData, bankDetails: e.target.value})} className="input-field" rows="3" placeholder="e.g. BDO Account: 123-456..." required ></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary px-6 py-2.5">
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
                            {heroPreview && <img src={heroPreview} alt="Hero Preview" className="w-full h-full object-cover" />}
                            <input type="file" onChange={handleFileChange(setHeroFile, 'hero')} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    <div className="grid gap-4">
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="Main Title" />
                        <textarea value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="input-field" rows="2" placeholder="Subtitle"></textarea>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-primary px-6 py-2.5">
                        {isLoading ? 'Saving...' : 'Save Visuals'}
                    </button>
                </form>
            </div>

            {/* SECTION 3: Admin User Management */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                    <FaUserShield /> Admin User Management
                </h2>
                
                {(userFormSuccess || userFormError) && (
                    <div className={`p-3 mb-4 rounded-xl border text-sm ${userFormSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
                        {userFormSuccess || userFormError}
                    </div>
                )}
                
                <form onSubmit={handleUserCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
                            <input name="name" value={userFormData.name} onChange={handleUserChange} className="input-field" placeholder="Full Name" required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                            <input name="email" type="email" value={userFormData.email} onChange={handleUserChange} className="input-field" placeholder="Email" required />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
                            <input name="password" type="password" value={userFormData.password} onChange={handleUserChange} className="input-field" placeholder="Password (Min 8 chars)" required />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Account Role</label>
                            <select name="role" value={userFormData.role} onChange={handleUserChange} className="input-field">
                                <option value="reseller">Reseller (Default)</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary px-6 py-2.5">
                        <FaUserPlus className="mr-2" /> Create New User
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SiteSettings;