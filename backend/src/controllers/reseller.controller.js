// reseller.controller.js (ESM) - WITH NOTIFICATION EMIT
import * as orderService from '../services/order.service.js';
import Order from '../models/order.model.js';
import { z } from 'zod';

const OrderItemSchema = z.object({ productId: z.string(), quantity: z.number().min(1) });
const CreateOrderSchema = z.object({
    items: z.array(OrderItemSchema).min(1),
    shippingAddress: z.object({ street: z.string(), city: z.string(), zipCode: z.string(), contactInfo: z.string(), shippingFee: z.number().optional() })
});

export const placeOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = CreateOrderSchema.parse(req.body);
        const newOrder = await orderService.createOrder(req.user.id, items, shippingAddress);

        // --- NEW: EMIT REAL-TIME NOTIFICATION ---
        const io = req.app.get('io'); // Get the socket instance
        if (io) {
            io.emit('new-order-notification', {
                message: `New Order received!`,
                orderId: newOrder._id,
                amount: newOrder.totalPrice,
                customer: req.user.name || 'Reseller' // Assuming auth middleware attaches name
            });
        }
        // ----------------------------------------

        res.status(201).json({ success: true, message: 'Order placed.', data: newOrder });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ resellerId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const order = await orderService.resellerCancelOrder(req.params.id, req.user.id);
        res.status(200).json({ success: true, message: 'Order cancelled.', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const uploadPaymentProofController = async (req, res) => {
    try {
        if (!req.body.proofUrl) throw new Error("Proof URL missing.");
        const order = await orderService.uploadPaymentProof(req.params.id, req.user.id, req.body.proofUrl);
        res.status(200).json({ success: true, message: 'Proof uploaded.', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};