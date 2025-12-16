// backend/src/controllers/orderController.js (FINAL: SMART NOTIFICATIONS)
import Order from '../models/order.model.js'; 
import Product from '../models/product.model.js'; 
import Notification from '../models/notification.model.js'; 

// @desc    Create new order
// @route   POST /api/reseller/orders
export const createOrder = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;
        if (!userId) return res.status(401).json({ message: 'Authentication required.' });
        
        const { items, shippingAddress, shippingFee } = req.body; 

        if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });

        const orderItems = [];
        let calculatedTotal = shippingFee || 0;

        for (const item of items) {
            const product = await Product.findById(item.productId); 
            if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });
            
            const price = product.discountPrice > 0 ? product.discountPrice : product.basePrice;
            
            orderItems.push({
                productId: product._id,
                name: product.name,
                SKU: product.SKU,
                priceAtTimeOfOrder: price,
                quantity: item.quantity
            });
            calculatedTotal += price * item.quantity;
        }

        const order = new Order({
            resellerId: userId,
            items: orderItems,
            totalPrice: calculatedTotal,
            shippingAddress,
            paymentMethod: 'BANK_TRANSFER', 
            shippingFee: shippingFee || 0,
            status: 'AWAITING PAYMENT' 
        });

        const createdOrder = await order.save();

        // --- 1. NEW ORDER NOTIFICATION ---
        try {
            const notif = await Notification.create({
                recipientRole: 'admin',
                type: 'NEW_ORDER',
                title: 'New Order Received',
                message: `Order #${createdOrder._id.toString().slice(-6)} placed. Amount: ₱${calculatedTotal}`,
                relatedId: createdOrder._id,
                isRead: false
            });

            const io = req.app.get('io');
            if (io) io.emit('notification', notif); 

        } catch (notifError) {
            console.error("Notification failed:", notifError);
        }
        
        res.status(201).json({ success: true, data: createdOrder });

    } catch (error) {
        res.status(500).json({ message: 'Server error during order creation.' });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/reseller/orders/my-orders
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;
        const orders = await Order.find({ resellerId: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Proof of Payment (UPDATED: BUMP STRATEGY)
// @route   PUT /api/reseller/orders/:id/pay
export const uploadPaymentProof = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.resellerId.toString() !== userId.toString()) return res.status(401).json({ message: 'Not authorized' });

        if (!req.body.proofUrl) return res.status(400).json({ message: 'Image upload failed.' });

        order.proofOfPaymentUrl = req.body.proofUrl; 
        order.status = 'PENDING VERIFICATION'; 
        await order.save();

        // --- 2. SMART NOTIFICATION UPDATE ---
        try {
            // 🛑 TRY TO FIND EXISTING NOTIFICATION FOR THIS ORDER
            let notif = await Notification.findOne({ relatedId: order._id, recipientRole: 'admin' });

            if (notif) {
                // ✅ UPDATE EXISTING (Bump to top, Mark Unread)
                notif.type = 'PAYMENT_PROOF';
                notif.title = 'Payment Proof Uploaded';
                notif.message = `Proof uploaded for Order #${order._id.toString().slice(-6)}. Please Verify.`;
                notif.isRead = false; // Make it red again
                notif.createdAt = new Date(); // Bump timestamp to now
                await notif.save();
            } else {
                // Fallback: If original was deleted, create new one
                notif = await Notification.create({
                    recipientRole: 'admin',
                    type: 'PAYMENT_PROOF',
                    title: 'Payment Proof Uploaded',
                    message: `Proof uploaded for Order #${order._id.toString().slice(-6)}.`,
                    relatedId: order._id,
                    isRead: false
                });
            }

            // ⚡ EMIT UPDATE
            const io = req.app.get('io');
            if (io) {
                io.emit('notification', notif);
                console.log("📢 Notification Updated via Socket:", notif.title);
            }
        } catch (notifError) {
            console.error("Proof notification failed:", notifError);
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelOrderUser = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.resellerId.toString() !== userId.toString()) return res.status(401).json({ message: 'Not authorized' });
        
        order.status = 'CANCELLED';
        await order.save();
        res.status(200).json({ success: true, message: 'Order cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markOrderDeliveredByUser = async (req, res) => {
    try {
        const userId = req.user ? (req.user._id || req.user.id) : null;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.resellerId.toString() !== userId.toString()) return res.status(401).json({ message: 'Not authorized' });

        order.status = 'DELIVERED';
        order.deliveredAt = Date.now();
        await order.save();
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};