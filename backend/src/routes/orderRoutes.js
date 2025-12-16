// backend/src/routes/order.routes.js (FINAL ESM VERSION)
import express from 'express';
import { authenticateToken } from '../middleware/auth.js'; 
import { multerUpload, uploadSingleImage } from '../middleware/upload.middleware.js'; 
import { 
    createOrder, // ⬅️ THIS was missing, preventing the order from being created
    getMyOrders, 
    markOrderDeliveredByUser, 
    uploadPaymentProof, 
    cancelOrderUser 
} from '../controllers/orderController.js';

const router = express.Router();

// --- RESELLER ROUTES ---

// 🛑 THE MISSING FIX: Receives the checkout request safely
router.post('/', authenticateToken, createOrder);

// Get my orders
router.get('/my-orders', authenticateToken, getMyOrders);

// Mark as received
router.patch('/:id/receive', authenticateToken, markOrderDeliveredByUser);

// Cancel Order
router.patch('/:id/cancel', authenticateToken, cancelOrderUser);

// Upload Proof of Payment
router.put(
  '/:id/pay', 
  authenticateToken, 
  multerUpload.single('proofImage'), 
  uploadSingleImage, 
  uploadPaymentProof
);

export default router;