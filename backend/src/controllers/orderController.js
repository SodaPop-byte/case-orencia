import Order from '../models/order.model.js'; 

// @desc    Create new order
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, totalPrice } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            resellerId: req.user._id,
            items,
            shippingAddress,
            paymentMethod,
            totalPrice,
            status: 'AWAITING_PAYMENT'
        });

        const createdOrder = await order.save();
        res.status(201).json({ success: true, data: createdOrder });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ resellerId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Proof of Payment
// @route   PUT /api/orders/:id/pay
export const uploadPaymentProof = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // 1. Check ownership
    if (order.resellerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // 2. Check status
    if (order.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({ message: 'Order is not awaiting payment' });
    }

    // 3. Check req.body.proofUrl (set by Cloudinary middleware)
    if (!req.body.proofUrl) {
      return res.status(400).json({ message: 'Image upload failed. No URL returned.' });
    }

    // 4. Update Order
    order.proofOfPaymentUrl = req.body.proofUrl; 
    order.status = 'PENDING_VERIFICATION';
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Order (User Side)
// @route   PATCH /api/orders/:id/cancel
export const cancelOrderUser = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check ownership
    if (order.resellerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Can only cancel if not yet processed/shipped
    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
        return res.status(400).json({ message: 'Cannot cancel order at this stage.' });
    }

    // Change status
    order.status = 'CANCELLED';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark Order as Received
// @route   PATCH /api/orders/:id/receive
export const markOrderDeliveredByUser = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.resellerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (order.status !== 'SHIPPED') {
            return res.status(400).json({ message: 'Order must be SHIPPED before receiving.' });
        }

        order.status = 'DELIVERED';
        order.deliveredAt = Date.now();
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};