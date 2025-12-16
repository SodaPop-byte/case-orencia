import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js'; 
import { multerUpload, uploadSingleImage } from '../middleware/upload.middleware.js';
import { getProducts } from '../controllers/product.controller.js';
import { 
    createOrder, 
    getMyOrders, 
    cancelOrderUser, 
    uploadPaymentProof 
} from '../controllers/orderController.js'; 

const router = Router();

// --- ROUTES ---

// Product Catalog
router.get('/products', authenticateToken, requireRole(['reseller']), getProducts);

// 🛑 DEBUG MIDDLEWARE: Put this exactly here
const debugRole = (req, res, next) => {
    console.log("🕵️ DEBUG SPY:");
    console.log("User ID:", req.user?._id || req.user?.id);
    console.log("User Role:", req.user?.role); 
    console.log("Required Role: reseller");
    next();
};

// Orders (With Debug Spy)
router.post(
    '/orders', 
    authenticateToken, 
    debugRole, // <--- THE SPY IS HERE
    requireRole(['reseller']), 
    createOrder
); 

router.get('/orders', authenticateToken, getMyOrders); 
router.patch('/orders/:id/cancel', authenticateToken, requireRole(['reseller']), cancelOrderUser);

// Upload Proof
router.patch(
    '/orders/:id/upload-proof', 
    authenticateToken, 
    requireRole(['reseller']), 
    multerUpload.single('proof'), 
    uploadSingleImage, 
    uploadPaymentProof
);

export default router;