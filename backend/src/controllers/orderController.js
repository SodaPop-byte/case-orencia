// ... existing imports

// @desc    Upload Proof of Payment
// @route   PUT /api/orders/:id/pay
// @access  Private (Reseller)
const uploadPaymentProof = async (req, res) => {
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

    // 3. FIXED: Check req.body.proofUrl (set by your Cloudinary middleware)
    // We check this instead of req.file because the middleware already handled the file
    if (!req.body.proofUrl) {
      return res.status(400).json({ message: 'Image upload failed. No URL returned.' });
    }

    // 4. Update Order
    order.proofOfPaymentUrl = req.body.proofUrl; 
    order.status = 'PENDING_VERIFICATION';
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Order (User Side)
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Reseller)
const cancelOrderUser = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check ownership
    if (order.resellerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Can only cancel if not yet processed/shipped
    // Prevents cancelling if the admin has already shipped it
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

module.exports = {
    // ... existing exports
    uploadPaymentProof,
    cancelOrderUser
};