// ProductCatalog.jsx (ESM) - RESTORED FEATURES + FIXED DATA DISPLAY
import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx'; // Pointed to correct context
import Toast from '../../components/common/Toast.jsx'; 
import { FaShoppingCart, FaPlus, FaSearch, FaFilter, FaMinus, FaLock } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom'; 

const ProductCatalog = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState(''); 

    const fetchProducts = async () => {
        setIsLoading(true);
        setError('');
        
        // 🛑 FIX: Use the route we just confirmed works on your server
        const endpoint = '/products'; 
        
        let query = `?limit=50&isActive=true`; // Changed isPublished to isActive to match your backend
        if (filter) query += `&category=${filter}`;
        if (searchTerm) query += `&search=${searchTerm}`;

        try {
            const response = await api.get(`${endpoint}${query}`); 
            
            // 🛑 FIX: Handle different response formats safely
            const data = response.data.data || response.data || [];
            setProducts(Array.isArray(data) ? data : []);
            
        } catch (err) {
            console.error(err);
            setError('Could not load products.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filter, searchTerm, isAuthenticated]);

    // --- HELPER TO FIX IMAGES & TITLES ---
    const getProductImage = (p) => {
        if (p.image) return p.image;
        if (p.images && p.images.length > 0) return p.images[0];
        if (p.coverImage) return p.coverImage;
        return 'https://via.placeholder.com/400';
    };

    const getProductName = (p) => p.name || p.title || p.productName || "Untitled Product";

    // --- Product Card Component ---
    const ProductCard = ({ product }) => {
        const [quantity, setQuantity] = useState(1); 
        
        // Handle Price (safe fallback)
        const basePrice = product.price || product.basePrice || 0;
        const discountPrice = product.discountPrice || 0;
        const finalPrice = discountPrice > 0 ? discountPrice : basePrice;
        
        // Handle Stock (safe fallback)
        const stock = product.stock || product.stockQuantity || 0;
        const outOfStock = stock <= 0;

        // Get safe name/image
        const name = getProductName(product);
        const image = getProductImage(product);

        const handleQuantityChange = (val) => {
            let newQty = parseInt(val);
            if (isNaN(newQty) || newQty < 1) newQty = 1;
            if (newQty > stock) newQty = stock;
            setQuantity(newQty);
        };

        const handleAddToCart = (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            if (outOfStock) return;
            
            if (isAuthenticated) {
                // Ensure we send a clean product object to cart
                const cartItem = { 
                    ...product, 
                    name: name, 
                    image: image, 
                    price: finalPrice 
                };
                addToCart(cartItem, quantity);
                setToastMessage(`Added ${quantity} x ${name} to cart`);
                setQuantity(1);
            } else {
                navigate('/register');
            }
        };
        
        return (
            <Link 
                to={`/product/${product._id}`} 
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300 block"
            >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                    <img 
                        src={image} 
                        alt={name} 
                        className={`w-full h-full object-cover transition duration-500 group-hover:scale-110 ${outOfStock ? 'opacity-50 grayscale' : ''}`} 
                    />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                        {product.inventoryType && (
                            <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold uppercase rounded-md">{product.inventoryType}</span>
                        )}
                        {discountPrice > 0 && !outOfStock && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold uppercase rounded-md">Sale</span>
                        )}
                    </div>
                    
                    {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-lg rotate-[-10deg]">OUT OF STOCK</span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col h-auto">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-indigo-600 transition">{name}</h3>
                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-xl font-extrabold text-gray-900 dark:text-white">₱{finalPrice.toLocaleString()}</span>
                            {discountPrice > 0 && (<span className="text-sm text-gray-400 line-through">₱{basePrice.toLocaleString()}</span>)}
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Quantity & Add Row */}
                        <div className="flex gap-2">
                            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg h-10 w-24 bg-gray-50 dark:bg-gray-700">
                                <button 
                                    onClick={(e) => {e.preventDefault(); handleQuantityChange(quantity - 1)}} 
                                    disabled={outOfStock || quantity <= 1 || !isAuthenticated} 
                                    className="px-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition"
                                >
                                    <FaMinus size={10} />
                                </button>
                                <input 
                                    type="number" 
                                    className="w-full h-full text-center bg-transparent border-none focus:ring-0 p-0 text-sm font-bold dark:text-white appearance-none" 
                                    value={quantity} 
                                    readOnly // Made readOnly to prevent typing errors during demo
                                />
                                <button 
                                    onClick={(e) => {e.preventDefault(); handleQuantityChange(quantity + 1)}} 
                                    disabled={outOfStock || quantity >= stock || !isAuthenticated} 
                                    className="px-2 text-gray-500 hover:text-indigo-600 disabled:opacity-30 transition"
                                >
                                    <FaPlus size={10} />
                                </button>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={handleAddToCart} 
                                disabled={outOfStock}
                                className={`flex-1 h-10 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${
                                    outOfStock
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                                    : isAuthenticated
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                                        : 'bg-gray-800 text-white hover:bg-gray-700 shadow-md shadow-gray-600/20' 
                                }`}
                            >
                                {outOfStock ? 'Unavailable' : isAuthenticated ? 'Add to Cart' : <><FaLock className="w-3 h-3" /> Sign Up</>}
                            </button>
                        </div>
                        
                        <div className="text-right mt-2">
                            <span className={`text-[10px] font-medium uppercase tracking-wide ${stock < 10 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                {stock} items left
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    // --- Main Render ---
    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header with Search/Filter */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catalog</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Browse our latest collections</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
                    <div className="relative group flex-1 max-w-md">
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition" />
                        <input 
                            type="search" 
                            placeholder="Search products..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-3.5 text-gray-400" />
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)} 
                            className="pl-10 pr-8 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            <option value="electronics">Electronics</option>
                            <option value="clothing">Clothing</option>
                            <option value="accessories">Accessories</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Content Area */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[1,2,3,4].map(i => (<div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No products found.</p>
                    <button onClick={() => {setFilter(''); setSearchTerm('')}} className="text-indigo-600 font-medium mt-2 hover:underline">Clear filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toastMessage && (<Toast message={toastMessage} onClose={() => setToastMessage('')} />)}
        </div>
    );
};

export default ProductCatalog;