import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api.js';
import { FaArrowRight, FaTag, FaFire } from 'react-icons/fa';

const Storefront = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/reseller/products?limit=4&isPublished=true');
                setFeaturedProducts(response.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const ProductCard = ({ product }) => (
        <Link to={`/reseller/product/${product._id}`} className="group block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="relative h-64 overflow-hidden">
                    <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                    />
                    {product.discountPrice > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md animate-pulse">
                            SALE
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide mb-1">
                        {product.inventoryType}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition">
                        {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col">
                            {product.discountPrice > 0 && (
                                <span className="text-xs text-gray-400 line-through">${product.basePrice}</span>
                            )}
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                ${product.discountPrice > 0 ? product.discountPrice : product.basePrice}
                            </span>
                        </div>
                        <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <FaArrowRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="space-y-16 pb-10">
            {/* HERO */}
            <section className="relative rounded-3xl overflow-hidden bg-gray-900 text-white shadow-2xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-indigo-900/50"></div>
                <div className="relative z-10 px-8 py-20 md:py-32 md:px-16 max-w-4xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-semibold mb-6 backdrop-blur-sm">
                        New Collection 2025
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        Authentic Filipiniana <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                            For Modern Resellers
                        </span>
                    </h1>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/reseller/catalog" className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center justify-center">
                            Shop Now <FaArrowRight className="ml-2" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <FaFire className="mr-3 text-orange-500" /> Trending Now
                    </h2>
                    <Link to="/reseller/catalog" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                        View All &rarr;
                    </Link>
                </div>
                
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map(product => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Storefront;