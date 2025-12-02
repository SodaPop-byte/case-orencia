// order.service.js (ESM) - FINAL COMPLETE VERSION
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import { deductStock, restoreStock } from './inventory.service.js';

// 1. CREATE ORDER (Reseller)
export const createOrder = async (resellerId, itemsData, shippingData) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const productIds = itemsData.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds }, isPublished: true }).session(session);

        let calculatedTotalPrice = 0;
        const orderItems = [];

        for (const itemData of itemsData) {
            const product = products.find(p => p._id.equals(itemData.productId));
            
            if (!product || product.stockQuantity < itemData.quantity) {
                throw new Error(`Insufficient stock or unavailable: ${product ? product.SKU : 'Unknown Product'}`);
            }
            
            const price = product.discountPrice > 0 ? product.discountPrice : product.basePrice;
            calculatedTotalPrice += price * itemData.quantity;

            orderItems.push({
                productId: product._id, 
                name: product.name, 
                SKU: product.SKU,
                quantity: itemData.quantity, 
                priceAtTimeOfOrder: price
            });
        }
        
        // Calculate final total
        const shippingCost = shippingData.shippingFee || 0;
        const finalTotal = calculatedTotalPrice + shippingCost;

        const newOrder = new Order({
            resellerId, 
            items: orderItems, 
            shippingAddress: shippingData,
            
            // --- FIX: Save Shipping Fee to Database ---
            shippingFee: shippingCost,
            // ------------------------------------------

            totalPrice: finalTotal,
            status: 'AWAITING PAYMENT',
            statusHistory: [{ status: 'AWAITING PAYMENT', updatedBy: resellerId }]
        });

        await newOrder.save({ session });
        await session.commitTransaction();
        return newOrder;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally { 
        session.endSession(); 
    }
};

// 2. UPDATE STATUS (Admin)
export const updateOrderStatus = async (orderId, newStatus, adminId, trackingNumber = null) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found.');

    const previousStatus = order.status;
    
    // Inventory Logic
    if (newStatus === 'PROCESSING' && previousStatus !== 'PROCESSING') {
        await deductStock(order.items, order._id, adminId);
    } else if (newStatus === 'CANCELLED' && previousStatus === 'PROCESSING') {
        await restoreStock(order.items, order._id, adminId);
    }

    // Tracking Logic
    if (newStatus === 'SHIPPED' && previousStatus !== 'SHIPPED') {
        order.trackingNumber = trackingNumber;
        order.shippingDate = new Date();
    }
    
    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, updatedBy: adminId });
    await order.save();
    return order;
};

// 3. UPLOAD PROOF (Reseller)
export const uploadPaymentProof = async (orderId, resellerId, proofUrl) => {
    const order = await Order.findOne({ _id: orderId, resellerId });
    if (!order) throw new Error('Order not found.');
    
    order.proofOfPaymentUrl = proofUrl;
    order.status = 'PENDING VERIFICATION';
    order.statusHistory.push({ status: 'PENDING VERIFICATION', updatedBy: resellerId });
    await order.save();
    return order;
};

// 4. CANCEL ORDER (Reseller)
export const resellerCancelOrder = async (orderId, resellerId) => {
    const order = await Order.findOne({ _id: orderId, resellerId, status: { $in: ['AWAITING PAYMENT', 'PENDING VERIFICATION'] } });
    if (!order) throw new Error('Cannot cancel order at this stage.');
    
    order.status = 'CANCELLED';
    order.statusHistory.push({ status: 'CANCELLED', updatedBy: resellerId });
    await order.save();
    return order;
};