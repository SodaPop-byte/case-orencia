// ProductDetails.jsx (ESM) - FINAL FIX: REMOVE AUTO-NAVIGATE TO CHECKOUT
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import Toast from '../../components/common/Toast.jsx'; // Import Toast
import { FaShoppingCart, FaArrowLeft, FaMinus, FaPlus, FaShieldAlt, FaTruck, FaLock } from 'react-icons/fa';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    
    // NEW STATE: Toast Notification
    const [toastMessage, setToastMessage] = useState(''); 

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/public/products/${id}`); 
                setProduct(response.data.data);
            } catch (err) {
                setProduct(null); 
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading Product Details...</div>;
    if (!product) return <div className="min-h-[60vh] flex items-center justify-center text-red-500">Product not found or has been removed.</div>;

    const price = product.discountPrice > 0 ? product.discountPrice : product.basePrice;
    const outOfStock = product.stockQuantity <= 0;

    const handleAction = () => {
        if (outOfStock) return;
        
        if (isAuthenticated) {
            addToCart(product, quantity);
            setToastMessage(`Added ${quantity} x ${product.name} to cart.`); // Show Toast
            // REMOVED: navigate('/reseller/checkout'); <-- User remains on page
        } else {
            navigate('/register');
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-indigo-600 mb-6 transition">
                <FaArrowLeft className="mr-2" /> Back to Catalog
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                {/* Left: Image Gallery */}
                <div className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900/50">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
                        <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-contain"/>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {product.images.map((img, idx) => (
                            <button key={idx} onClick={() => setSelectedImage(idx)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${selectedImage === idx ? 'border-indigo-600' : 'border-transparent'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Product Info */}
                <div className="p-8 md:p-12 flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>
                    <div className="flex items-end gap-3 mb-6">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₱{price.toFixed(2)}</span>
                        {product.discountPrice > 0 && <span className="text-lg text-gray-400 line-through mb-1">₱{product.basePrice.toFixed(2)}</span>}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{product.description}</p>
                    
                    <div className="border-t border-b border-gray-100 dark:border-gray-700 py-6 mb-8 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <FaShieldAlt className="text-green-500" /> Authentic Quality Guarantee
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <FaTruck className="text-blue-500" /> Ships within 24 hours
                        </div>
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isAuthenticated} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl"><FaMinus /></button>
                                <span className="w-12 text-center font-bold dark:text-white">{quantity}</span>
                                <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} disabled={!isAuthenticated} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl"><FaPlus /></button>
                            </div>
                            <span className="text-sm text-gray-500">{product.stockQuantity} pieces available</span>
                        </div>

                        {/* DYNAMIC ACTION BUTTON */}
                        <button 
                            onClick={handleAction} 
                            disabled={outOfStock} 
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-xl ${
                                outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                                isAuthenticated ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' :
                                'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-400'
                            }`}
                        >
                            {outOfStock ? 'Out of Stock' : (
                                isAuthenticated ? <><FaShoppingCart /> Add to Cart</> : <><FaLock /> Login to Order</>
                            )}
                        </button>
                        
                        {!isAuthenticated && (
                            <p className="text-center text-xs text-gray-500 mt-2">
                                You must have a verified reseller account to place orders.
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
            {/* RENDER TOAST */}
            {toastMessage && (<Toast message={toastMessage} onClose={() => setToastMessage('')} />)}
        </div>
    );
};

export default ProductDetails;