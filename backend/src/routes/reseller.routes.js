import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadSingleImage } from '../middleware/upload.middleware.js';
import { placeOrder, getMyOrders, cancelOrder, uploadPaymentProofController } from '../controllers/reseller.controller.js';
import { getProductsController } from '../controllers/product.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['reseller']));

router.get('/products', getProductsController);
router.post('/orders', placeOrder);
router.get('/orders', getMyOrders);
router.put('/orders/:id/cancel', cancelOrder);
router.patch('/orders/:id/upload-proof', multerUpload.single('proof'), uploadSingleImage, uploadPaymentProofController);

export default router;