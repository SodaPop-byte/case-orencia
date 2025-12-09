import express from 'express';
import { 
    createProduct, 
    getProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct 
} from '../controllers/product.controller.js';

// Import your Cloudinary/Multer middleware
import { multerUpload, uploadMultipleImages } from '../middleware/upload.middleware.js';

const router = express.Router();

// ==========================================
// 🟢 PUBLIC ROUTES (Anyone can view)
// ==========================================

// Get all products (with search/filter)
router.get('/', getProducts);

// Get single product details
router.get('/:id', getProductById);


// ==========================================
// 🟠 ADMIN ROUTES (Protected)
// ==========================================
// Note: If you have an authentication middleware (like protectRoute), 
// add it before the upload middleware.

// ✅ CREATE PRODUCT
// 1. multerUpload catches the files from the form
// 2. uploadMultipleImages sends them to Cloudinary & gets URLs
// 3. createProduct saves the data to MongoDB
router.post(
    '/', 
    multerUpload.array('images', 5), 
    uploadMultipleImages, 
    createProduct
);

// ✅ UPDATE PRODUCT
router.put(
    '/:id', 
    multerUpload.array('images', 5), 
    uploadMultipleImages, 
    updateProduct
);

// ✅ DELETE PRODUCT
router.delete('/:id', deleteProduct);

export default router;