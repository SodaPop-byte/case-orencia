import { Router } from 'express';
import { getProductsController, getProductByIdController } from '../controllers/product.controller.js';
import { getLandingContent } from '../controllers/content.controller.js';

const router = Router();

router.get('/landing', getLandingContent);
router.get('/products', getProductsController);
router.get('/products/:id', getProductByIdController); // FIX: Dedicated single fetch route

export default router;