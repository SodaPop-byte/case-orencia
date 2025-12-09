// src/routes/admin.routes.js
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadMultipleImages } from '../middleware/upload.middleware.js';

// Import Controller Functions
import { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    getProducts,
    getProductById
} from '../controllers/product.controller.js'; 

import { 
    getAllOrders, 
    updateOrderStatusController, 
    getSalesReport, 
    getInventoryReport, 
    getUserDetails,
    createAdminUserController 
} from '../controllers/admin.controller.js'; 

import { 
    getInventory, 
    adjustStock, 
    getLowStock 
} from '../controllers/inventory.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['admin']));

// --- PRODUCT ROUTES ---

// CREATE PRODUCT (With Debugger)
router.post('/products', 
    // 1. Parse Files
    multerUpload.array('images', 5), 
    
    // 2. DEBUGGER: Check if files arrived
    (req, res, next) => {
        console.log("-----------------------------------------");
        console.log("1. Route Hit: POST /admin/products");
        console.log("2. Files Found by Multer:", req.files ? req.files.length : 0);
        console.log("3. Body Content:", req.body);
        console.log("-----------------------------------------");
        next();
    },

    // 3. Upload to Cloudinary
    uploadMultipleImages, 
    
    // 4. Save to DB
    createProduct
);

// READ
router.get('/products', getProducts); 
router.get('/products/:id', getProductById);

// UPDATE
router.put('/products/:id', multerUpload.array('images', 5), uploadMultipleImages, updateProduct); 
router.delete('/products/:id', deleteProduct);

// --- OTHER ADMIN ROUTES ---
router.get('/inventory', getInventory);
router.patch('/inventory/adjust', adjustStock);
router.get('/inventory/low-stock', getLowStock);
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatusController);
router.get('/reports/sales', getSalesReport); 
router.get('/reports/inventory', getInventoryReport); 
router.post('/users', createAdminUserController); 
router.get('/users/:id', getUserDetails); 

export default router;