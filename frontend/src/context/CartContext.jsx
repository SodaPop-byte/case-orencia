// CartContext.jsx (ESM)
import React, { createContext, useState, useContext, useEffect } from 'react';
// import api from '../utils/api.js'; // Future use: syncing cart with backend/local storage

export const CartContext = createContext();

const getInitialCart = () => {
    // Load cart from local storage on initial load
    const savedCart = localStorage.getItem('resellerCart');
    return savedCart ? JSON.parse(savedCart) : [];
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(getInitialCart);

    // Effect to update local storage whenever cartItems changes
    useEffect(() => {
        localStorage.setItem('resellerCart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Calculate total price and total items
    const cartSummary = cartItems.reduce(
        (summary, item) => {
            summary.totalPrice += item.price * item.quantity;
            summary.totalItems += item.quantity;
            return summary;
        },
        { totalPrice: 0, totalItems: 0 }
    );
    
    // ----------------------------------------------------
    // CART ACTIONS
    // ----------------------------------------------------

    const addToCart = (product, quantity = 1) => {
        const existingItemIndex = cartItems.findIndex(item => item.productId === product._id);

        if (existingItemIndex > -1) {
            // Item exists: update quantity
            const newCart = [...cartItems];
            newCart[existingItemIndex].quantity += quantity;
            setCartItems(newCart);
        } else {
            // New item: add to cart
            const newItem = {
                productId: product._id,
                name: product.name,
                SKU: product.SKU,
                price: product.discountPrice > 0 ? product.discountPrice : product.basePrice,
                stock: product.stockQuantity,
                image: product.images[0] || 'placeholder.jpg',
                quantity: quantity,
            };
            setCartItems([...cartItems, newItem]);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevCart => 
            prevCart.map(item => 
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCartItems(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        ...cartSummary,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};