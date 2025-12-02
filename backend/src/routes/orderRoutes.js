const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import the middleware
// Ensure your upload.middleware.js is exporting correctly for 'require'
const { multerUpload, uploadSingleImage } = require('../middleware/upload.middleware'); 

const { 
    getMyOrders, 
    markOrderDeliveredByUser, 
    uploadPaymentProof, // <--- The function we just fixed
    cancelOrderUser 
} = require('../controllers/orderController');

// --- RESELLER ROUTES ---

// Get my orders
router.get('/my-orders', protect, getMyOrders);

// Mark as received
router.patch('/:id/receive', protect, markOrderDeliveredByUser);

// Cancel Order
router.patch('/:id/cancel', protect, cancelOrderUser);

// Upload Proof of Payment
// Chain: Protect -> Multer (Parse File) -> Cloudinary (Get URL) -> Controller (Save DB)
router.put(
  '/:id/pay', 
  protect, 
  multerUpload.single('proofImage'), // Must match Frontend FormData key
  uploadSingleImage, 
  uploadPaymentProof
);

module.exports = router;