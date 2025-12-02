// order.model.js (ESM) - COMPLETE & UNABRIDGED
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    name: { type: String, required: true },
    SKU: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtTimeOfOrder: { type: Number, required: true, min: 0.01 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    // --- CRITICAL FIX: Ensure 'ref' matches your User model name exactly ---
    resellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Must be 'User' (Capital U), matching user.model.js
        index: true
    },
    // -----------------------------------------------------------------------
    items: {
        type: [OrderItemSchema],
        required: true
    },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true },
        contactInfo: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['QR_CODE', 'BANK_TRANSFER'], 
        default: 'QR_CODE' 
    },
    proofOfPaymentUrl: {
        type: String,
        default: null 
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0.01
    },
    status: {
        type: String,
        enum: [
            'AWAITING PAYMENT', 
            'PENDING VERIFICATION', 
            'PROCESSING', 
            'SHIPPED', 
            'DELIVERED', 
            'CANCELLED'
        ],
        default: 'AWAITING PAYMENT',
        index: true
    },
    statusHistory: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    // --- Tracking Fields ---
    trackingNumber: { 
        type: String, 
        default: null 
    },
    shippingDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;