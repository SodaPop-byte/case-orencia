// admin.routes.js (ESM) - FINAL FIXED IMPORTS
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadMultipleImages } from '../middleware/upload.middleware.js';

// --- 1. PRODUCT CONTROLLER IMPORTS ---
// Only Product CRUD functions come from here
import { 
    createProductController, 
    updateProductController, 
    deleteProductController, 
    getProductsController,
    getProductByIdController
} from '../controllers/product.controller.js'; 

// --- 2. ADMIN CONTROLLER IMPORTS ---
// Order, Report, and User functions come from here
import { 
    getAllOrders, 
    updateOrderStatusController, 
    getSalesReport, 
    getInventoryReport, 
    getUserDetails 
} from '../controllers/admin.controller.js'; // <--- THIS MUST POINT TO ADMIN.CONTROLLER

// --- 3. INVENTORY CONTROLLER IMPORTS ---
import { 
    getInventory, 
    adjustStock, 
    getLowStock 
} from '../controllers/inventory.controller.js';


const router = Router();

// Middleware applied to ALL Admin routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// ---------------------------------------------------------------------
// PRODUCT MANAGEMENT 
// ---------------------------------------------------------------------
router.post('/products', multerUpload.array('images', 5), uploadMultipleImages, createProductController);
router.get('/products', getProductsController); 
router.put('/products/:id', updateProductController); 
router.delete('/products/:id', deleteProductController);

// ---------------------------------------------------------------------
// INVENTORY MANAGEMENT 
// ---------------------------------------------------------------------
router.get('/inventory', getInventory);
router.patch('/inventory/adjust', adjustStock);
router.get('/inventory/low-stock', getLowStock);

// ---------------------------------------------------------------------
// ORDER & REPORT MANAGEMENT
// ---------------------------------------------------------------------
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatusController);
router.get('/reports/sales', getSalesReport); 
router.get('/reports/inventory', getInventoryReport); 
router.get('/users/:id', getUserDetails);

export default router;