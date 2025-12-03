// admin.routes.js (ESM) - FINAL FIXED ROUTES
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { multerUpload, uploadMultipleImages } from '../middleware/upload.middleware.js';

// 1. PRODUCT CONTROLLER
import { 
    createProductController, 
    updateProductController, 
    deleteProductController, 
    getProductsController,
    getProductByIdController
} from '../controllers/product.controller.js'; 

// 2. ADMIN CONTROLLER (Order, Report, and User creation/details functions)
import { 
    getAllOrders, 
    updateOrderStatusController, 
    getSalesReport, 
    getInventoryReport, 
    getUserDetails,
    createAdminUserController // <--- CRITICAL IMPORT
} from '../controllers/admin.controller.js'; 

// 3. INVENTORY CONTROLLER
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

// --- NEW USER MANAGEMENT ROUTES ---
router.post('/users', createAdminUserController); // <--- FIX: POST route for user creation
router.get('/users/:id', getUserDetails); 

export default router;