import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadSingleImage } from '../middleware/upload.middleware.js';

// 1. FIX: Import 'getProducts' (not getProductsController)
import { getProducts } from '../controllers/product.controller.js';

// 2. FIX: Ensure these match your actual Controller exports
// Based on our previous work, these were likely in 'orderController.js'
// If you moved them to 'reseller.controller.js', ensure the names match exactly.
import { 
    createOrder,            // Was placeOrder
    getMyOrders, 
    cancelOrderUser,        // Was cancelOrder
    uploadPaymentProof      // Was uploadPaymentProofController
} from '../controllers/orderController.js'; // Check if this file name is correct in your folder

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['reseller']));

// --- ROUTES ---

// Product Catalog
router.get('/products', getProducts);

// Orders
router.post('/orders', createOrder); // Place Order
router.get('/orders', getMyOrders);  // View History
router.patch('/orders/:id/cancel', cancelOrderUser); // Cancel

// Upload Proof (With Middleware)
router.patch(
    '/orders/:id/upload-proof', 
    multerUpload.single('proof'), 
    uploadSingleImage, 
    uploadPaymentProof
);

export default router;