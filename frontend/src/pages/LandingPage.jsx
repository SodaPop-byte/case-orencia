// LandingPage.jsx (ESM) - CRASH PROOF VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
// Removed duplicate optimizeImage import
import { 
    FaArrowRight, FaGem, FaTruck, FaHandshake, 
    FaCheckCircle, FaStar, FaBoxOpen, FaMoneyBillWave, 
    FaUserPlus, FaInstagram, FaFacebookF 
} from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [heroData, setHeroData] = useState({
        heroImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3', 
        title: 'Elevate Your Business with Premium Native Wear',
        subtitle: 'Source authentic Barongs, Sayas, and Fabrics directly from the manufacturer.'
    });

    const [latestProducts, setLatestProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [contentRes, prodRes] = await Promise.all([
                    api.get('/public/landing'),
                    api.get('/public/products?limit=3&isPublished=true&sortBy=createdAt&sortOrder=desc')
                ]);

                if (contentRes.data.data) setHeroData(contentRes.data.data);
                if (prodRes.data.data) setLatestProducts(prodRes.data.data);

            } catch (err) { console.error("Error loading landing data:", err); } 
            finally { setIsLoading(false); }
        };
        fetchData();

        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            if (isScrolled !== scrolled) setScrolled(isScrolled);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);


    // --- HELPER COMPONENTS ---

    const LandingProductCard = ({ product }) => {
        // --- THE FIX IS HERE --- 
        // We add "|| 0" so if basePrice is missing, it becomes 0 instead of undefined
        const price = (product.discountPrice > 0 ? product.discountPrice : product.basePrice) || 0;
        
        const handleAtcClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/register'); 
        };

        return (
            <Link to={`/product/${product._id}`} className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 block">
                <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/400'} // Added safety check for images array
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
                    alt={product.name || 'Product'} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                
                <div className="absolute bottom-0 left-0 p-8 w-full text-white translate-y-2 group-hover:translate-y-0 transition duration-300">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1 block">
                        {product.inventoryType || 'Stock'}
                    </span>
                    <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-indigo-200 transition">
                        {product.name || 'Untitled Product'}
                    </h3>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-white/20">
                        {/* --- SAFETY WRAPPER AROUND PRICE --- */}
                        <span className="text-lg font-bold text-white">₱{Number(price).toFixed(2)}</span>
                        
                        <button 
                            onClick={handleAtcClick} 
                            className="bg-indigo-600 px-4 py-2 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition transform active:scale-95 flex items-center gap-2"
                        >
                            <FaArrowRight size={14} /> Buy
                        </button>
                    </div>
                </div>
            </Link>
        );
    };

    const HeroSkeleton = () => (
        <div className="max-w-3xl animate-pulse">
            <div className="h-4 w-48 bg-gray-500/50 rounded-full mb-8"></div>
            <div className="h-16 w-full bg-gray-500/50 rounded-lg mb-6"></div>
            <div className="h-10 w-5/6 bg-gray-500/50 rounded-lg mb-10"></div>
            <div className="flex gap-4">
                 <div className="h-12 w-40 bg-indigo-600/50 rounded-xl"></div>
                 <div className="h-12 w-40 bg-white/20 rounded-xl"></div>
            </div>
        </div>
    );

    const ProductSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse shadow-xl">
                    <div className="h-3/4 bg-gray-300 dark:bg-gray-600 rounded-t-3xl"></div>
                    <div className="p-4 space-y-2">
                        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );


    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
            
            {/* --- TOP ANNOUNCEMENT BAR --- */}
            <div className="bg-indigo-900 text-white text-xs font-bold py-2 text-center tracking-wide z-[60] relative">
                🎉 FREE SHIPPING for new resellers on orders over ₱5,000! <Link to="/register" className="underline hover:text-indigo-200 ml-2">Join Now</Link>
            </div>

            {/* --- NAVBAR --- */}
            <nav 
                className={`fixed w-full z-50 transition-all duration-500 ease-in-out border-b ${
                    scrolled 
                        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md py-3 border-gray-200 dark:border-gray-800 top-0' 
                        : 'bg-transparent border-transparent py-5 top-8' 
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-12">
                        {/* Branding */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">C</div>
                            <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white drop-shadow-md'}`}>Case Orencia</span>
                        </div>

                        {/* Desktop Links */}
                        <div className="flex items-center gap-6">
                            <Link to="/login" className={`text-sm font-medium transition-colors duration-300 hidden sm:block ${scrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white/90 drop-shadow-sm'}`}>Log In</Link>
                            <Link to="/register" className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 shadow-lg hover:-translate-y-0.5 ${scrolled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-900 hover:bg-gray-100'}`}>
                                Join as Reseller
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroData.heroImage} className="w-full h-full object-cover scale-105" alt="Hero Background" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-gray-900/30"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
                    {isLoading ? <HeroSkeleton /> : (
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold mb-8 uppercase tracking-wider shadow-sm">
                                Official Supplier
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-2xl">
                                {heroData.title}
                            </h1>
                            <p className="text-xl text-gray-200 mb-10 max-w-xl leading-relaxed font-light drop-shadow-md">
                                {heroData.subtitle}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/catalog" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/40 flex items-center justify-center">
                                    Browse Catalog <FaArrowRight className="ml-2" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* --- DYNAMIC LATEST ARRIVALS SECTION --- */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold dark:text-white">Latest Arrivals</h2>
                            <p className="text-gray-500 mt-2">Fresh authentic stock, directly from the warehouse.</p>
                        </div>
                        <Link to="/catalog" className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center transition">
                            View Full Catalog <FaArrowRight className="ml-2" />
                        </Link>
                    </div>

                    {isLoading ? <ProductSkeleton /> : latestProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {latestProducts.map(product => (
                                <LandingProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No products published yet.</p>
                        </div>
                    )}
                </div>
            </section>
            
            {/* --- FEATURES GRID --- */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><FaGem /></div>
                            <div><h3 className="text-lg font-bold mb-2 dark:text-white">Authentic Quality</h3><p className="text-gray-500 text-sm leading-relaxed">Direct from weavers in Lumban.</p></div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><FaTruck /></div>
                            <div><h3 className="text-lg font-bold mb-2 dark:text-white">Next-Day Shipping</h3><p className="text-gray-500 text-sm leading-relaxed">Orders ship within 24 hours.</p></div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl shrink-0"><FaHandshake /></div>
                            <div><h3 className="text-lg font-bold mb-2 dark:text-white">Partner Support</h3><p className="text-gray-500 text-sm leading-relaxed">Live chat with admin team.</p></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FOOTER --- */}
            <footer className="bg-gray-900 text-white pt-24 pb-12">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Ready to grow your business?</h2>
                    <p className="text-gray-400 mb-8">Join hundreds of successful resellers today.</p>
                    <div className="flex justify-center gap-4">
                        <Link to="/register" className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Create Account</Link>
                    </div>
                    <p className="mt-12 text-sm text-gray-600">© 2025 Case Orencia.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;