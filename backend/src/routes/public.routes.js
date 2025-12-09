import { Router } from 'express';

// --- FIX: Import the correct names (getProducts, getProductById) ---
import { 
    getProducts, 
    getProductById 
} from '../controllers/product.controller.js';

const router = Router();

// -----------------------------------------------------
// PUBLIC ROUTES (No Login Required)
// -----------------------------------------------------

// Get all products (Catalog)
router.get('/products', getProducts);

// Get single product details
router.get('/products/:id', getProductById);

// Landing Page Data (Optional - if you have a specific controller for this)
// If you don't have a specific landing controller, you can just return success
router.get('/landing', (req, res) => {
    res.json({ 
        success: true, 
        data: {
            heroImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3', 
            title: 'Elevate Your Business with Premium Native Wear',
            subtitle: 'Source authentic Barongs, Sayas, and Fabrics directly from the manufacturer.'
        } 
    });
});

export default router;