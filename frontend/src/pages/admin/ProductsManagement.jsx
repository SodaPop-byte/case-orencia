// ProductsManagement.jsx (ESM) - FINAL VERSION (Crash Proof + All Features)
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Required for Dashboard link
import api from '../../utils/api.js';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaBoxOpen, FaImage, FaSearch, FaFilter } from 'react-icons/fa';

const MOCK_CATEGORIES = [
    { _id: '65b537f02b37a8585e50937a', name: 'Traditional Wear' },
    { _id: '65b537f02b37a8585e50937b', name: 'Modern Filipiniana' },
];

const ProductsManagement = () => {
    const location = useLocation(); // Hook to detect if we came from Dashboard
    
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');

    // Form state 
    const initialFormState = {
        name: '', SKU: '', basePrice: '', discountPrice: '0', description: '', 
        inventoryType: 'barong', category: MOCK_CATEGORIES[0]._id, 
        stockQuantity: 0, isPublished: false, images: null, imagePreviews: []
    };
    const [formData, setFormData] = useState(initialFormState);
    const [currentProductId, setCurrentProductId] = useState(null);

    // --- 1. AUTO-OPEN MODAL LOGIC ---
    useEffect(() => {
        // Check if Dashboard sent the "openCreate" signal
        if (location.state?.openCreate) {
            openCreateModal();
            // Clear the state so it doesn't keep opening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // --- Data Fetching ---
    const fetchProducts = async () => {
        setIsLoading(true);
        setError('');
        
        let query = `?limit=50`;
        if (searchTerm) query += `&search=${searchTerm}`;
        if (filterType) query += `&inventoryType=${filterType}`;

        try {
            const response = await api.get(`/admin/products${query}`); 
            setProducts(response.data.data || []); // Safety check: || []
        } catch (err) {
            if (err.response?.status !== 404) console.error(err);
            setProducts([]); // Clear products on error
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const delay = setTimeout(() => { fetchProducts(); }, 500);
        return () => clearTimeout(delay);
    }, [searchTerm, filterType]);

    // --- Form Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: files,
                imagePreviews: files.map(file => URL.createObjectURL(file)),
            }));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        // Validation: Price
        const base = parseFloat(formData.basePrice) || 0;
        const discount = parseFloat(formData.discountPrice) || 0;

        if (discount > base) {
            setError("Discount price cannot be higher than the regular price.");
            setIsLoading(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'images' && key !== 'imagePreviews') {
                 data.append(key, formData[key]);
            }
        });
        
        // Append Images
        if (formData.images) {
            formData.images.forEach(image => {
                data.append('images', image);
            });
        }
        
        try {
            // FIX: Explicitly set multipart/form-data to ensure images are sent correctly
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (isEditing) {
                await api.put(`/admin/products/${currentProductId}`, data, config);
            } else {
                await api.post('/admin/products', data, config); 
            }
            
            setSuccessMessage(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
            setIsModalOpen(false);
            setFormData(initialFormState);
            fetchProducts(); 
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error("Submit Error:", err.response);
            let msg = err.response?.data?.message || 'Submission failed.';
            if (err.response?.data?.details) {
                const details = err.response.data.details.map(d => `• ${d.path}: ${d.message}`).join('\n');
                msg = `${msg}\n${details}`;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Actions ---
    const startEdit = (product) => {
        setCurrentProductId(product._id);
        setIsEditing(true);
        setIsModalOpen(true);
        setFormData({
            ...product,
            basePrice: product.basePrice ? product.basePrice.toString() : '',
            discountPrice: product.discountPrice ? product.discountPrice.toString() : '0',
            stockQuantity: product.stockQuantity ? product.stockQuantity.toString() : '0',
            images: null, // Reset file input
            imagePreviews: product.images || [], // Show existing images
            category: product.category?._id || product.category || MOCK_CATEGORIES[0]._id
        });
    };

    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try { await api.delete(`/admin/products/${id}`); fetchProducts(); } catch (err) { alert('Failed to delete.'); }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    // --- UI Components ---
    const StatusBadge = ({ active, text }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
            active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
            {text}
        </span>
    );

    const TypeBadge = ({ type }) => {
        const colors = {
            barong: 'bg-blue-50 text-blue-700 border-blue-200',
            saya: 'bg-pink-50 text-pink-700 border-pink-200',
            fabrics: 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase border ${colors[type] || 'bg-gray-100'}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage inventory and catalog listings</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
                    {/* SEARCH */}
                    <div className="relative group flex-1 max-w-md">
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition" />
                        <input 
                            type="search" 
                            placeholder="Search products..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    
                    {/* FILTER */}
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3.5 text-gray-400" />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field pl-10 pr-8 appearance-none cursor-pointer">
                            <option value="">All Types</option>
                            <option value="barong">Barong</option>
                            <option value="saya">Saya</option>
                            <option value="fabrics">Fabrics</option>
                        </select>
                    </div>
                    
                    {/* BUTTON */}
                    <button onClick={openCreateModal} className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap">
                        <FaPlus className="mr-2"/> Add Product
                    </button>
                </div>
            </div>
            
            {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm whitespace-pre-wrap">{error}</div>}
            {successMessage && <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-r-lg shadow-sm">{successMessage}</div>}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {products.length === 0 && !isLoading ? <div className="text-center py-16"><h3 className="text-lg text-gray-500">No products found</h3></div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Info</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price / Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {/* FIX: Add safety check 'images?.[0]' so it doesn't crash on bad data */}
                                                <img className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm mr-4" 
                                                     src={product.images?.[0] || 'https://via.placeholder.com/50'} 
                                                     alt="" />
                                                <div>
                                                    <div className="text-sm font-bold dark:text-white">{product.name || 'Untitled'}</div>
                                                    <div className="text-xs text-gray-500">{product.SKU || 'No SKU'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><TypeBadge type={product.inventoryType} /></td>
                                        
                                        {/* CRASH PROOF PRICE COLUMN */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {/* FIX: '|| 0' prevents .toFixed from crashing on undefined */}
                                                    ₱{(product.basePrice || 0).toFixed(2)}
                                                </span>
                                                {product.discountPrice > 0 && <span className="text-xs text-red-500 line-through">Sale: ₱{product.discountPrice}</span>}
                                            </div>
                                            <div className={`text-xs font-semibold mt-1 ${(product.stockQuantity || 0) < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {product.stockQuantity || 0} in stock
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge active={product.isPublished} text={product.isPublished ? 'Published' : 'Draft'} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => startEdit(product)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-4 transition"><FaEdit className="w-4 h-4"/></button>
                                            <button onClick={() => deleteProduct(product._id)} className="text-gray-400 hover:text-red-600 transition"><FaTrash className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-10">
                        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 transition relative">
                                <input type="file" onChange={handleImageChange} multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!isEditing && (!formData.imagePreviews || formData.imagePreviews.length === 0)} />
                                <FaImage className="text-4xl text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Click to upload product images</p>
                                <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                                {formData.imagePreviews && formData.imagePreviews.length > 0 && (
                                    <div className="mt-4 flex gap-2 w-full overflow-x-auto z-20 relative">
                                        {formData.imagePreviews.map((src, i) => <img key={i} src={src} className="w-16 h-16 object-cover rounded border" />)}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
                                    <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">SKU</label>
                                    <input name="SKU" value={formData.SKU} onChange={handleChange} className="input-field" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price</label>
                                    <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} className="input-field" step="0.01" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-500 uppercase mb-1 block">Discount</label>
                                    <input type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} className="input-field border-red-200" step="0.01" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Stock</label>
                                    <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="input-field" min="0" required />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                                <select name="inventoryType" value={formData.inventoryType} onChange={handleChange} className="input-field">
                                    <option value="barong">Barong</option>
                                    <option value="saya">Saya</option>
                                    <option value="fabrics">Fabrics</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows="3" required></textarea>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded" />
                                    <span className="ml-2 text-sm dark:text-gray-300">Publish Immediately</span>
                                </label>
                                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400">
                                    {isLoading ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsManagement;